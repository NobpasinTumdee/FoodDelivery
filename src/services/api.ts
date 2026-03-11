import { supabase } from './supabaseClient';
import type { Product, Addon, DeliveryRound, Customer, Order, OrderItem, OrderItemAddon } from '../types/database';

export const api = {
  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });
    
    if (error) throw error;
    return data as Product[];
  },

  // Addons
  async getAddons() {
    const { data, error } = await supabase
      .from('addons')
      .select('*');
    
    if (error) throw error;
    return data as Addon[];
  },

  // Delivery Rounds
  async getOpenDeliveryRounds() {
    const { data, error } = await supabase
      .from('delivery_rounds')
      .select('*')
      .eq('status', 'OPEN')
      .order('delivery_date', { ascending: true });
    
    if (error) throw error;
    return data as DeliveryRound[];
  },

  // Customers
  async getCustomerProfile(userId: string) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data as Customer;
  },

  async updateCustomerProfile(userId: string, updates: Partial<Customer>) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Customer;
  },

  // Storage
  async uploadSlip(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('slips') // Assuming a storage bucket named 'slips' exists
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('slips').getPublicUrl(filePath);
    return data.publicUrl;
  },

  // Orders
  async submitOrder(orderData: Partial<Order>, items: Partial<OrderItem>[], addons: Partial<OrderItemAddon>[][]) {
    // 1. Insert Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Insert Order Items
    for (let i = 0; i < items.length; i++) {
      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert({ ...items[i], order_id: order.id })
        .select()
        .single();

      if (itemError) throw itemError;

      // 3. Insert Addons for this item
      const itemAddons = addons[i];
      if (itemAddons && itemAddons.length > 0) {
        const addonsToInsert = itemAddons.map(a => ({
          ...a,
          order_item_id: orderItem.id
        }));
        const { error: addonError } = await supabase
          .from('order_item_addons')
          .insert(addonsToInsert);
        
        if (addonError) throw addonError;
      }
    }

    return order;
  },

  // Admin
  async getOrdersForRound(roundId: number) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(nickname, phone),
        order_items(
          *,
          products(name),
          order_item_addons(addon_name, addon_price)
        )
      `)
      .eq('delivery_round_id', roundId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateOrderStatus(orderId: number, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId);

    if (error) throw error;
    return data;
  },

  async updateRoundStatus(roundId: number, status: string) {
    const { data, error } = await supabase
      .from('delivery_rounds')
      .update({ status })
      .eq('id', roundId);
    
    if (error) throw error;
    return data;
  }
};

