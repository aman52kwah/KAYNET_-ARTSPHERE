import 'dotenv/config'
import {Payment} from '../models/Payment.js';
import { CustomOrder } from '../models/CustomOrders.js';
import { Orders } from '../models/Orders.js';
import axios from 'axios';
import express from 'express';
import crypto from 'crypto';
const router = express.Router();


const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL ='https://api.paystack.co';

//initiliaze payment payment for custom orders (50% deposit)
router.post('/initialize-custom-order',async (req,res)=>{
    try {
        const {customOrderId} = req.body;
        const customOrder = await CustomOrder.findByPk(customOrderId);
        if(!customOrder){
            return res.status(404).json({message:'Custom Id not found'})
        }
        if(customOrderId.userId !==req.user.id ){
            return res.status(403).json({message:'Unauthorized'});
        }


        // calculate 50% deposit
        const depositAmount =(parseFloat(customOrder.totalPrice)* 0.5).toFixed(2);
        const amountInCedis = Math.round(depositAmount *100);


        //initialize paystack transaction

        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transaction/initialize`,
            {email: req.user.email,
                amount: amountInCedis,
                metadata:{
                    customOrderId:customOrder.id,
                    userId: req.user.id,
                    paymentType:'partial'

                },
                callback_url:`${process.env.CLIENT_URL}/payment,verify`
            },
            {
                headers:{
                    Authorization:`Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type':'Application/json'
                }
            }
        );

        await Payment.create({
            customOrderId:customOrder.id,
            amount: depositAmount,
            paystackReference:response.data.data.reference,
            status:'pending',
            paymentType:'partial'
        });


        res.json({
            authorizationUrl:response.data.data.authorization_url,
            reference:response.data.data.reference,
        })
    } catch (error) {
        console.error('Payment initialization error:', error.response?.data || error);
    res.status(500).json({ message: 'Failed to initialize payment', error: error.message });
    }
});

//Initialize payment for ready-made order (full payment)
router.post('/initialize-order', async (req,res)=>{
    try {
        const {orderId} = req.body;
        const order = await Orders.findByPk(orderId);
        if(!order){
            return res.status(404).json({message:'Order not found'});
        }

        if(order.userId !==req.user.id){
            return res.status(403).json({message:'unauthorized'});
        }

        const amountInCedis = Math.round(parseFloat(order.totalAmount) * 100);

        //initialize paystack transaction
        const response = await axios.post(
            `${PAYSTACK_BASE_URL}/transaction/initialize`,
            {
                email:req.user.email,
                amount:amountInCedis,
                metadata:{
                    orderId:order.id,
                    userId:req.user.id,
                    paymentType:'full'
                },
                callback_url:`${process.env.CLIENT_URL}/payment/verify`
            },
            {
                headers:{
                    Authorization:`Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type':'application/json'
                }
            }
        );

        //create payment record
        await Payment.create({
            orderId:order.id,
            amount:order.totalAmount,
            paystackReference:response.data.data.reference,
            status:'pending',
            paymentType:'full'
        });

        res.json({
            authorizationUrl:reference.data.data.authorization_url,
            reference:response.data.data
        });
    } catch (error) {
        console.error('Payment initialization error:', error.response?.data || error);
        res.status(500).json({message:'Failed to initialize payment', error:error.message})
    }
});

//verify payment
router.get('/verify/:reference', async(req,res)=>{
    try {
        const {reference} = req.params;

        //verify transaction with paystack

        const response = await axios.get(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
            headers:{
                Authorization:`Bearer ${PAYSTACK_SECRET_KEY}`
            }
        }
    );

    const {status,metadata, amount} = response.data.data;

    if(status === 'success'){
        //update payment record
        const payment = await Payment.findOne({
            where:{paystackReference:reference}
        });

        if(payment){
            payment.status = 'success';
            await Payment.save();

            //update order or custom order status
            if(metadata.customOrderId){
                const customOrder = await CustomOrder.findByPk(metadata.customOrderId);
                if(customOrder){
                    customOrder.paidAmount = parseFloat(customOrder.paidAmount) + (amount / 100);
                    customOrder.status = 'confirmed';
                    await customOrder.save();
                }
            } else if(metadata.orderId){
                const order = await Orders.findByPk(metadata.orderId);
                if(order){
                    order.status = 'paid';
                    await order.save();
                }
                    
            }
        }
        res.json({
            success:true,
            message:'Payment verified successfully',
            data:response.data.data
        });
    } else{
        res.status(404).json({
            success:false,
            message:'Payment verification failed'
        });
    }

    
    } catch (error) {
        console.error('Payment verification error:',error.response?.data || error);
        res.status(500).json({message:'Failed to verify payment', error:error.message})
    }
});


//Paystack webhook for payment notification

router.post('/webhook', async(req,res)=>{
    try {
        const hash = crypto
        .createHmac('sha512',PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');

        if(hash === req.headers['x-paystack-signature']){
            const event = req.body;

            if(event.event === 'charge.success'){
                const {reference,metadata,amount} = event.data;

                const payment = await Payment.findOne({
                    where:{paystackReference:reference}
                });

                if(payment && payment.status === 'pending'){
                    payment.status = 'success';
                    await Payment.save();




                    //Update related order/custom order
                    if(metadata.customOrderId){
                        const customOrder = await CustomOrder.findByPk(metadata.customOrderId);
                        if(customOrder){
                            customOrder.paidAmount = parseFloat(customOrder.paidAmount)+(amount / 100);
                            customOrder.status='confirmed';
                            await customOrder.save();
                        }
                    }
                    else if(metadata.orderId){
                        const order = await Orders.findByPk(metadata.orderId);
                        if(order){
                            order.status = 'paid';
                            await order.save();
                        }
                    }
                }
            }
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
});

// get user payment history

router.get('/history', async(req,res)=>{
    try {

        const payments = await Payment.findAll({
            include:[
                {model:Orders, where:{userId:req.user.id}, required:false},
                {model:CustomOrder,where:{userId:req.user.id},required:false}
            ],
            order:[['createdAt','DESC']]
        });
        res.json(payments);
        
    } catch (error) {
        console.error('Error fetching payment history:',error);
        res.status(500).json({message:'Failed tp fetch payment history'});
    }
});

export default router;