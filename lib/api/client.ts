import { supabase } from '../supabase/client';
import { API_ENDPOINTS, HTTP_METHODS, API_STATUS } from './endpoints';
import { ApiResponse, PaginatedResponse } from '../../types';
import { API_CONFIG } from '../../constants';

class ApiClient {
  private async request<T>(
    endpoint: string,
    method: string = HTTP_METHODS.GET,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      let response;

      switch (method) {
        case HTTP_METHODS.GET:
          response = await supabase
            .from(endpoint.replace('/rest/v1/', ''))
            .select('*');
          break;

        case HTTP_METHODS.POST:
          response = await supabase
            .from(endpoint.replace('/rest/v1/', ''))
            .insert(data)
            .select();
          break;

        case HTTP_METHODS.PUT:
        case HTTP_METHODS.PATCH:
          const tableName = endpoint.split('?')[0].replace('/rest/v1/', '');
          const id = endpoint.match(/id=eq\.(.+?)(&|$)/)?.[1];
          if (!id) throw new Error('ID not found in endpoint');
          
          response = await supabase
            .from(tableName)
            .update(data)
            .eq('id', id)
            .select();
          break;

        case HTTP_METHODS.DELETE:
          const deleteTableName = endpoint.split('?')[0].replace('/rest/v1/', '');
          const deleteId = endpoint.match(/id=eq\.(.+?)(&|$)/)?.[1];
          if (!deleteId) throw new Error('ID not found in endpoint');
          
          response = await supabase
            .from(deleteTableName)
            .delete()
            .eq('id', deleteId);
          break;

        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        data: response.data as T,
        error: null,
      };
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      return {
        data: null as T,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Generic methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HTTP_METHODS.GET);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HTTP_METHODS.POST, data);
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HTTP_METHODS.PUT, data);
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HTTP_METHODS.PATCH, data);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, HTTP_METHODS.DELETE);
  }

  // Authentication methods
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser() {
    try {
      console.log('🌐 ApiClient: getCurrentUser called');
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('🌐 ApiClient: getCurrentUser result:', { user, error });
      return { user, error };
    } catch (error) {
      console.error('🌐 ApiClient: getCurrentUser error:', error);
      return { user: null, error };
    }
  }

  // Realtime subscription
  subscribeToChannel(channel: string, callback: (payload: any) => void) {
    return supabase
      .channel(channel)
      .on('postgres_changes', { event: '*', schema: 'public', table: channel }, callback)
      .subscribe();
  }

  unsubscribeFromChannel(channel: string) {
    const channelInstance = supabase.channel(channel);
    supabase.removeChannel(channelInstance);
  }

  // Edge Function methods
  async scheduleDraws() {
    console.warn('Edge function scheduleDraws not yet deployed');
    return { success: false, error: 'Function not yet deployed' };
  }

  async runDraws() {
    console.warn('Edge function runDraws not yet deployed');
    return { success: false, error: 'Function not yet deployed' };
  }

  async getStreams() {
    console.warn('Edge function getStreams not yet deployed');
    return { success: false, error: 'Function not yet deployed' };
  }

  async searchArchiveContent(query: string) {
    console.warn('Edge function searchArchiveContent not yet deployed');
    return { success: false, error: 'Function not yet deployed' };
  }

  async addStream(streamData: any) {
    console.warn('Edge function addStream not yet deployed');
    return { success: false, error: 'Function not yet deployed' };
  }
}

export const apiClient = new ApiClient();
export default apiClient;
