
// routes/cart.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import models from '../models/index.js';

const router = express.Router();

// Get user's cart
router.get('/', requireAuth, async (req, res) => {
  try {
    const dbModels = await models;
    const cartModel = dbModels.Cart;
    const cartItemsModel = dbModels.CartItems;
    const productsModel = dbModels.Products;

    // Find or create cart for user
    let cart = await cartModel.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: cartItemsModel,
          as: 'items',
          include: [
            {
              model: productsModel,
              as: 'product',
              attributes: ['id', 'name', 'price', 'imageUrl', 'stockQuantity', 'sizes', 'colors'],
            },
          ],
        },
      ],
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await cartModel.create({
        userId: req.user.id,
        status: 'active',
      });
      cart.items = [];
    }

    // Calculate cart totals
    const subtotal = cart.items.reduce(
      (total, item) => total + parseFloat(item.price) * item.quantity,
      0
    );

    res.json({
      cart: {
        id: cart.id,
        userId: cart.userId,
        status: cart.status,
        itemCount: cart.items.length,
        subtotal: subtotal.toFixed(2),
        items: cart.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name,
          productImage: item.product?.imageUrl,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: parseFloat(item.price),
          total: (parseFloat(item.price) * item.quantity).toFixed(2),
          availableStock: item.product?.stockQuantity || 0,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart', error: error.message });
  }
});

// Add item to cart
router.post('/items', requireAuth, async (req, res) => {
  try {
    const dbModels = await models;
    const cartModel = dbModels.Cart;
    const cartItemsModel = dbModels.CartItems;
    const productsModel = dbModels.Products;

    const { productId, quantity = 1, size, color } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if product exists and has stock
    const product = await productsModel.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stockQuantity < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${product.stockQuantity} available` 
      });
    }

    // Find or create cart
    let cart = await cartModel.findOne({
      where: { userId: req.user.id },
    });

    if (!cart) {
      cart = await cartModel.create({
        userId: req.user.id,
        status: 'active',
      });
    }

    // Check if item already exists in cart
    const existingItem = await cartItemsModel.findOne({
      where: {
        cartId: cart.id,
        productId,
        size: size || null,
        color: color || null,
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stockQuantity < newQuantity) {
        return res.status(400).json({ 
          message: `Cannot add more. Only ${product.stockQuantity} available` 
        });
      }

      existingItem.quantity = newQuantity;
      await existingItem.save();

      return res.json({
        message: 'Cart item updated',
        item: existingItem,
      });
    }

    // Create new cart item
    const cartItem = await cartItemsModel.create({
      cartId: cart.id,
      productId,
      quantity,
      size,
      color,
      price: product.price,
    });

    // Fetch the created item with product details
    const createdItem = await cartItemsModel.findByPk(cartItem.id, {
      include: [
        {
          model: productsModel,
          as: 'product',
        },
      ],
    });

    res.status(201).json({
      message: 'Item added to cart',
      item: createdItem,
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
});

// Update cart item quantity
router.patch('/items/:itemId', requireAuth, async (req, res) => {
  try {
    const dbModels = await models;
    const cartItemsModel = dbModels.CartItems;
    const productsModel = dbModels.Products;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cartItem = await cartItemsModel.findByPk(itemId, {
      include: [
        {
          model: productsModel,
          as: 'product',
        },
      ],
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    // Check stock
    if (cartItem.product.stockQuantity < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${cartItem.product.stockQuantity} available` 
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({
      message: 'Cart item updated',
      item: cartItem,
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Error updating cart item', error: error.message });
  }
});

// Remove item from cart
router.delete('/items/:itemId', requireAuth, async (req, res) => {
  try {
    const dbModels = await models;
    const cartItemsModel = dbModels.CartItems;
    const { itemId } = req.params;

    const cartItem = await cartItemsModel.findByPk(itemId);

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await cartItem.destroy();

    res.json({
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ message: 'Error removing cart item', error: error.message });
  }
});

// Clear cart
router.delete('/', requireAuth, async (req, res) => {
  try {
    const dbModels = await models;
    const cartModel = dbModels.Cart;
    const cartItemsModel = dbModels.CartItems;

    const cart = await cartModel.findOne({
      where: { userId: req.user.id },
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await cartItemsModel.destroy({
      where: { cartId: cart.id },
    });

    res.json({
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
});

export default router;