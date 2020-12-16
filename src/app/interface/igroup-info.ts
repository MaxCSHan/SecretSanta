import { IGroupDetail } from './igroup-detail';
import { IExclusionList } from './iexclusion-list';
import { IEventUser } from './ievent-user';

export interface IGroupInfo {
  host: IEventUser;
  members: IEventUser[];
  exclusionList: IExclusionList;
  details: IGroupDetail;
}
