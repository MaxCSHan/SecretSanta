import { IEventUser } from './ievent-user';

export interface IExclusionList {
  isExclusive: boolean;
  exclusive?: IEventUser[];
}
