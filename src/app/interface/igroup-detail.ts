import { Timestamp } from '@google-cloud/firestore';

export interface IGroupDetail {
  groupName: string;
  dateOfExchange: Timestamp;
  currency: string;
  budget: string;
  invitationMessage: string;
  themes: { name: string }[];
}
