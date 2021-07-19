import { Injectable } from '@nestjs/common';
import { CreateMatchHistoryDto } from '../match_history/dto/create-match-history.dto';
import { UpdateMatchHistoryDto } from '../match_history/dto/update-match-history.dto';
import { MatchHistory } from '../match_history/entities/match-history.entity';
import { MatchHistoryService } from '../match_history/match_history.service';
import { UsersService } from '../users/users.service';
import { CreateUsersDto } from '../users/dto/create-users.dto';
import { UpdateUsersDto } from '../users/dto/update-users.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly matchHistoryService: MatchHistoryService,
    private readonly usersService: UsersService,
  ) {}

  async findProfileById(myID: string, otherID: string) {
    let profile = {};
    const { intra_id } = await this.usersService.findByNickname(otherID);
    if (myID !== otherID) {
      const { friend_list, block_list } =
        await this.usersService.findByNickname(myID);
      const friend = this.nullCheckInclude(friend_list, intra_id);
      const block = this.nullCheckInclude(block_list, intra_id);
      profile = { friend, block };
    }
    const { list, win, lose } = await this.checkWin(intra_id);
    return { ...profile, list, win, lose };
  }

  async addFriend(myID: string, otherID: string) {
    return await this.usersService.addFriend(myID, otherID);
  }

  async addBlock(myID: string, otherID: string) {
    return await this.usersService.addBlock(myID, otherID);
  }

  async findAll() {
    const users = await this.usersService.findAll();
    const history = await this.matchHistoryService.findAll();
    return { users, history };
  }

  async clear() {
    return await this.matchHistoryService.clear();
  }

  // helper functions

  nullCheckInclude(list: string[], intra_id: string): boolean {
    if (list) return list.includes(intra_id);
    return false;
  }

  async checkWin(intra_id: string) {
    let profile = { list: [], win: 0, lose: 0 };
    const total_history = await this.matchHistoryService.findById(intra_id);

    if (total_history) {
      let count = 5;
      for (let index = total_history.length - 1; index >= 0; index--) {
        const { p1_id, p2_id, winner } = total_history[index];
        const player_id = p1_id === intra_id ? p2_id : p1_id;
        const { nickname } = await this.usersService.findByIntraId(player_id);
        let win = false;

        if (winner === intra_id) {
          profile.win++;
          win = true;
        }
        if (count-- > 0) profile.list.push({ nickname, win });
      }
      profile.lose = total_history.length - profile.win;
    }
    return profile;
  }
}
