
import { supabase } from './supabaseClient';

const isSupabaseConfigured = () => {
  const url = (process.env as any).VITE_SUPABASE_URL;
  return url && !url.includes('your-project-url');
};

export const dataService = {
  async getRepairs(userId: string) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('repairs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (!error) return data;
    }
    return JSON.parse(localStorage.getItem(`repairit_repairs_${userId}`) || '[]');
  },

  async addRepair(userId: string, repair: any) {
    const newRepair = { ...repair, id: crypto.randomUUID(), user_id: userId, created_at: new Date().toISOString() };
    
    if (isSupabaseConfigured()) {
      await supabase.from('repairs').insert(newRepair);
    }
    
    const local = JSON.parse(localStorage.getItem(`repairit_repairs_${userId}`) || '[]');
    localStorage.setItem(`repairit_repairs_${userId}`, JSON.stringify([newRepair, ...local]));
  },

  async getMessages(userId: string, expertName: string) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('messages').select('*').eq('user_id', userId).eq('expert_name', expertName).order('created_at', { ascending: true });
      if (!error) return data;
    }
    return JSON.parse(localStorage.getItem(`repairit_msgs_${userId}_${expertName}`) || '[]');
  },

  async addMessage(userId: string, msg: any) {
    const newMsg = { ...msg, user_id: userId, created_at: msg.created_at || new Date().toISOString() };
    
    if (isSupabaseConfigured()) {
      await supabase.from('messages').insert(newMsg);
    }
    
    // Save message locally
    const local = JSON.parse(localStorage.getItem(`repairit_msgs_${userId}_${msg.expert_name}`) || '[]');
    localStorage.setItem(`repairit_msgs_${userId}_${msg.expert_name}`, JSON.stringify([...local, newMsg]));

    // Track this expert in the user's chat index
    await this.ensureExpertInIndex(userId, msg.expert_name);
  },

  async ensureExpertInIndex(userId: string, expertName: string) {
    const chatIndexKey = `repairit_chat_index_${userId}`;
    const experts = JSON.parse(localStorage.getItem(chatIndexKey) || '[]');
    if (!experts.includes(expertName)) {
      experts.push(expertName);
      localStorage.setItem(chatIndexKey, JSON.stringify(experts));
    }
  },

  async getContactedExperts(userId: string): Promise<string[]> {
    const chatIndexKey = `repairit_chat_index_${userId}`;
    return JSON.parse(localStorage.getItem(chatIndexKey) || '[]');
  },

  async getUserCoins(userId: string): Promise<number> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('profiles').select('repair_coins').eq('id', userId).single();
      if (!error && data) return data.repair_coins;
    }
    const coins = localStorage.getItem(`repairit_coins_${userId}`);
    return coins ? parseInt(coins, 10) : 0;
  },

  async addUserCoins(userId: string, amount: number) {
    const current = await this.getUserCoins(userId);
    const updated = current + amount;
    
    if (isSupabaseConfigured()) {
      await supabase.from('profiles').update({ repair_coins: updated }).eq('id', userId);
    }
    
    localStorage.setItem(`repairit_coins_${userId}`, updated.toString());
    return updated;
  }
};
