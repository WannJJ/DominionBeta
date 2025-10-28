import { Card, Cost } from "./cards.js";
import { getBasicStats } from "../features/PlayerSide/PlayerSide.jsx";
import { opponentManager } from "../features/OpponentSide/Opponent.js";
import { getPlayer } from "../player.js";
import audioManager from "../Audio/audioManager.js";
//Basic Cards
class Copper extends Card {
  constructor() {
    super("Copper", new Cost(0), Card.Type.TREASURE, "Basic/");
    this.value = 1;
  }
  getInitAmount() {
    let amount = [46, 46, 39, 32, 85, 78];
    let player_count = Math.max(
      1,
      Math.min(opponentManager.getOpponentList().length + 1, 6)
    );
    return amount[player_count - 1];
  }
  async play() {
    await getBasicStats().addCoin(1);
  }
  async add_score() {}
}
class Silver extends Card {
  constructor() {
    super("Silver", new Cost(3), Card.Type.TREASURE, "Basic/");
    this.value = 2;
  }
  getInitAmount() {
    let amount = [40, 40, 40, 40, 80, 80];
    let player_count = Math.max(
      1,
      Math.min(opponentManager.getOpponentList().length + 1, 6)
    );
    return amount[player_count - 1];
  }
  async play() {
    if (getPlayer().attacked_by_envious) {
      await getBasicStats().addCoin(1);
    } else {
      await getBasicStats().addCoin(2);
    }
  }
}
class Gold extends Card {
  constructor() {
    super("Gold", new Cost(6), Card.Type.TREASURE, "Basic/");
    this.value = 3;
  }
  getInitAmount() {
    let amount = [30, 30, 30, 30, 60, 60];
    let player_count = Math.max(
      1,
      Math.min(opponentManager.getOpponentList().length + 1, 6)
    );
    return amount[player_count - 1];
  }
  async play() {
    if (getPlayer().attacked_by_envious) {
      await getBasicStats().addCoin(1);
    } else {
      await getBasicStats().addCoin(3);
    }
  }
}
class Platinum extends Card {
  constructor() {
    super("Platinum", new Cost(9), Card.Type.TREASURE, "Basic/");
    this.value = 5;
  }
  getInitAmount() {
    let amount = [12, 12, 12, 12, 12, 12];
    let player_count = Math.max(
      1,
      Math.min(opponentManager.getOpponentList().length + 1, 6)
    );
    return amount[player_count - 1];
  }
  async play() {
    await getBasicStats().addCoin(5);
  }
}

class Curse extends Card {
  constructor() {
    super("Curse", new Cost(0), Card.Type.CURSE, "Basic/");
    this.score = -1;
  }
  getInitAmount() {
    let amount = [10, 10, 20, 30, 40, 50];
    let player_count = Math.max(
      1,
      Math.min(opponentManager.getOpponentList().length + 1, 6)
    );
    return amount[player_count - 1];
  }
  async is_gained() {
    await getBasicStats().addScore(-1);
    audioManager.playSound("crow");
  }
  async is_trashed() {
    await getBasicStats().addScore(1);
  }
  async add_score() {
    await getBasicStats().addScore(-1);
  }
}
class Estate extends Card {
  constructor() {
    super("Estate", new Cost(2), Card.Type.VICTORY, "Basic/");
    this.score = 1;
  }
  getInitAmount() {
    let amount = [8, 8, 12, 12, 12, 12];
    let player_count = Math.max(
      1,
      Math.min(opponentManager.getOpponentList().length + 1, 6)
    );
    return amount[player_count - 1];
  }
  async is_gained() {
    await getBasicStats().addScore(1);
  }
  async is_trashed() {
    await getBasicStats().addScore(-1);
  }
  async add_score() {
    await getBasicStats().addScore(1);
  }
}
class Duchy extends Card {
  constructor() {
    super("Duchy", new Cost(5), Card.Type.VICTORY, "Basic/");
    this.score = 3;
  }
  getInitAmount() {
    let amount = [8, 8, 12, 12, 12, 12];
    let player_count = Math.max(
      1,
      Math.min(opponentManager.getOpponentList().length + 1, 6)
    );
    return amount[player_count - 1];
  }
  async is_gained() {
    await getBasicStats().addScore(3);
  }
  async is_trashed() {
    await getBasicStats().addScore(-3);
  }
  async add_score() {
    await getBasicStats().addScore(3);
  }
}
class Province extends Card {
  constructor() {
    super("Province", new Cost(8), Card.Type.VICTORY, "Basic/");
    this.score = 6;
  }
  getInitAmount() {
    let amount = [8, 8, 12, 12, 15, 18]; //[8, 8, 12, 12, 15, 18]
    let player_count = Math.max(
      1,
      Math.min(opponentManager.getOpponentList().length + 1, 6)
    );
    return amount[player_count - 1];
  }
  async is_gained() {
    await getBasicStats().addScore(6);
  }
  async is_trashed() {
    await getBasicStats().addScore(-6);
  }
  async add_score() {
    await getBasicStats().addScore(6);
  }
}
class Colony extends Card {
  constructor() {
    super("Colony", new Cost(11), Card.Type.VICTORY, "Basic/");
    this.score = 10;
  }
  getInitAmount() {
    let amount = [8, 8, 12, 12, 12, 12, 12];
    let player_count = Math.max(
      1,
      Math.min(opponentManager.getOpponentList().length + 1, 6)
    );
    return amount[player_count - 1];
  }
  async is_gained() {
    await getBasicStats().addScore(10);
  }
  async is_trashed() {
    await getBasicStats().addScore(-10);
  }
  async add_score() {
    await getBasicStats().addScore(10);
  }
}

export {
  Copper,
  Silver,
  Gold,
  Platinum,
  Curse,
  Estate,
  Duchy,
  Province,
  Colony,
};
