// WhatsApp Message Types from Meta API
export interface WhatsAppMessageBody {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: 'delivered' | 'read' | 'sent';
          timestamp: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'file';
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
  };
  document?: {
    id: string;
    filename: string;
    mime_type: string;
  };
  audio?: {
    id: string;
    mime_type: string;
  };
  video?: {
    id: string;
    mime_type: string;
  };
}

export interface WhatsAppSendMessagePayload {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'text' | 'image' | 'document' | 'audio';
  text?: {
    body: string;
  };
  image?: {
    link?: string;
    id?: string;
  };
  document?: {
    link?: string;
    id?: string;
    filename?: string;
  };
  audio?: {
    link?: string;
    id?: string;
  };
}

export interface WhatsAppError {
  error?: {
    message: string;
    type: string;
    code: number;
  };
}
