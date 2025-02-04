import { Card, Cost } from "./expansions/cards.js";
import {
  getBasicSupply,
  getKingdomSupply,
  markSupplyPile,
  removeMarkSupplyPile,
} from "./features/TableSide/Supply.jsx";
import { findSupplyPile } from "./features/TableSide/SupplyPile.jsx";
import {
  getDiscard,
  getDeck,
} from "./features/PlayerSide/CardPile/CardPile.jsx";
import {
  getPlayField,
  getHand,
} from "./features/PlayerSide/CardHolder/CardHolder.jsx";
import {
  getPlayArea,
  getExile,
  getSetAside,
} from "./features/PlayerSide/BottomLeftCorner/SideArea.jsx";
import { setInstruction } from "./features/PlayerSide/Instruction.jsx";
import { getButtonPanel } from "./features/PlayerSide/ButtonPanel.jsx";
import { getBasicStats } from "./features/PlayerSide/PlayerSide.jsx";
import {
  clear_indent,
  deindent,
  getLogger,
  indent_,
} from "./Components/Logger.jsx";
import { getGameState } from "./game_logic/GameState.js";
import { landscapeEffectManager } from "./features/TableSide/LandscapeEffect/LandscapeEffectManager.js";
import {
  drawNCards,
  play_card,
  autoplay_treasures,
  buy_and_gain_card,
  buy_landscape_card,
  trash_card,
  gain_card,
  mayPlayCardFromHand,
  discardCardFromPlayField,
  may_payoff_debt,
} from "./game_logic/Activity.js";

import { reactionEffectManager } from "./game_logic/ReactionEffectManager.js";
import audioManager from "./Audio/audioManager.js";
import { openResultBoard } from "./features/AfterGame/Result.jsx";
import { opponentManager } from "./features/OpponentSide/Opponent.js";
import {
  create_number_picker,
  hide_number_picker,
} from "./Components/user_input/NumberPicker.jsx";
import {
  HexBoonManager,
  stateHolder,
} from "./expansions/nocturne/HexBoonManager.js";
import {
  getIslandMat,
  getNativeVillageMat,
  getPirateShipMat,
} from "./features/PlayerSide/BottomLeftCorner/PlayerMats.jsx";
import {
  PHASE_ACTION,
  PHASE_BUY,
  PHASE_NIGHT,
  PHASE_REACTION,
  PHASE_WAITING,
  PHASE_START_TURN,
  PHASE_CLEAN_UP,
  PHASE_END_TURN,
  PHASE_END_GAME,
} from "./utils/constants.js";
import { getSupportHand } from "./features/SupportHand.jsx";
import { AssistantSharp } from "@mui/icons-material";

/*
        When Another: When play attack, when gain
        When You: When you trash a card (Tomb,Priest, Sewers ), When you gain, When you play (Urchin, Seaway, LostArts, Training, Pathfinding, Teacher, Champion, Sauna), 
            When you discard (Herbalist, Scheme, Horn, Trickster, Tireless, Herbalist), When shuffling/ when you shuffle (Order of masons, order of astroloders, fated, stash, star chart),
        At the start (114):  At the start of your next turn (70, almost duration), At the start of your turn(23), At the start of your buy phase(9, Only for landmark, ally, state, artifact), 
            At the start of Clean-up(Alchemist, Encampment, Improve, Walled Village), At the start of each of your turn(Hireling, Crypt, Quartermaster, Endless Chalice, Prince), 
        At the end (10): At the end of your buy phase(Treasury, Hermit, Merchant ild, Wine Merchant, Pageant, Exploration), At the end of your turn(Island Folk), At the end of the game(Distant Land), At the end of each turn(Way of the Squirrel, River Gift)
        The next time (12): you gain(Charm, Cage, SeludedShrine, Abundance, Rush, Mirror), you play (Kiln, Flagship), you shuffle(Avoid),
            a Supply pile empites(Search), anyone gains a Treasure(Cutthroat), the first card you play(Landing Party)
        The first time (6): you play(merchant, outpost, crossroad, fools gold, citadel), each other plays (Enchantress),
        
        */
let player = null;
class Player {
  constructor(
    username,
    ordinal_number = 0,
    report_ingame = function () {},
    notify_end_turn = function () {},
    notify_end_game = function () {}
  ) {
    this.username = username;
    this.ordinal_number = ordinal_number;
    this.report_ingame = report_ingame;
    this.notify_end_turn = notify_end_turn;
    this.notify_end_game = notify_end_game;
    // phase: action, buy, night, reaction, waiting, other
    this.phase = PHASE_WAITING;

    // common stats
    //TODO: villager, potion, artifact, token, ... // Should implement in BasicStats
    this.turn = 0;
    this.move = 0; // is refered to undo

    // player's different fields
    /*
        this.nocturneEffectHolder = new NocturneEffectHolder();
        */
    this.all_cards = [];

    //attributes for buy phase
    this.can_play_treasure_buy_phase = true; // After buying things, player cant play treasure.
    this.can_not_buy_action_this_turn = false; // Use for Deluded

    this.attacked_by_envious = false; // Use for Envious
    this.is_attacked_by_enchantress = false; //Use for enchantress

    //this.can_not_be_attacked = false; // Use for Moat, Lighthouse and Shield, Guardian,
    //TODO
    this.unaffected_id_list = [];

    this.extra_turn = {
      playExtraTurn: false,
      cannotPlayExtraTurnByCards: false,
      currentlyInExtraTurn: false,
      possession: null,
      cardsCauseExtraTurn: [], //Outpost, Mission, Voyage, Island Folk, Journey, Posession, Seize the day,
      SeizeTheDay: null,
      Fleet: null,
    };
    player = this;
  }
  async update_score() {
    await getBasicStats().setScore(0);
    this.all_cards = [];
    this.all_cards.push(...getDeck().getCardAll());
    this.all_cards.push(...getDiscard().getCardAll());
    this.all_cards.push(...getHand().getCardAll());
    this.all_cards.push(...getPlayField().getCardAll());
    this.all_cards.push(...getExile().getCardAll());

    this.all_cards.push(...getPlayArea().getCardAll());
    this.all_cards.push(...getSetAside().getCardAll());
    this.all_cards.push(...getIslandMat().getCardAll());
    this.all_cards.push(...getPirateShipMat().getCardAll());
    this.all_cards.push(...getNativeVillageMat().getCardAll());

    this.all_cards.sort((a, b) => (a.attr > b.attr) - (a.attr < b.attr));
    for (let card of this.all_cards) {
      await card.add_score();
    }
    for (let state of stateHolder.getStateList()) {
      await state.add_score();
    }
    for (let effectComponent of landscapeEffectManager
      .getEffectComponentListAll()
      .filter((card) => card.getType().includes("Landmark"))) {
      let effectCard = effectComponent.getCard();
      await effectCard.add_score();
    }
  }
  getPhase() {
    return this.phase;
  }
  setPhase(phase) {
    if (
      ![
        PHASE_ACTION,
        PHASE_BUY,
        PHASE_NIGHT,
        PHASE_REACTION,
        PHASE_WAITING,
        PHASE_START_TURN,
        PHASE_CLEAN_UP,
        PHASE_END_TURN,
        PHASE_END_GAME,
      ].includes(phase)
    ) {
      throw new EvalError();
    }
    this.phase = phase;
  }
  getTurn() {
    return this.turn;
  }
  setTurn(turn) {
    this.turn = turn;
  }
  // PHASE HANDLING
  async continue_phase() {
    let clearFunc = function () {
      getButtonPanel().clear_buttons();
      setInstruction("");
      getHand().remove_mark();

      removeMarkSupplyPile();
      landscapeEffectManager.remove_mark();

      hide_number_picker();
      getSupportHand().clear();
    };
    clearFunc();
    if (this.phase === PHASE_START_TURN) {
      await this.start_turn();
    } else if (this.phase === PHASE_ACTION) {
      if (getBasicStats().getAction() <= 0) {
        await this.start_buy_phase();
      } else {
        await this.update_action_phase();
      }
    } else if (this.phase === PHASE_BUY) {
      if (getBasicStats().getBuy() <= 0) {
        await this.end_buy_phase();
      } else {
        await this.update_buy_phase();
      }
    } else if (this.phase === PHASE_NIGHT) {
      this.update_night_phase();
    } else if (this.phase === PHASE_REACTION) {
      this.phase = PHASE_WAITING;
    } else if (this.phase === PHASE_WAITING) {
      throw new Error("waiting...");
    } else throw new Error("INVALID Phase handling");
  }

  // START PHASES
  async start_waiting_phase() {
    this.phase = PHASE_WAITING;
    await this.notify_end_turn();
  }
  async start_game() {
    if (getHand().length() > 0 || getPlayField().length() > 0) {
      while (getHand().length() > 0) {
        await getDiscard().addCard(await getHand().pop());
      }
    }
    await drawNCards(5);
    await getBasicStats().setAction(1);
    await getBasicStats().setBuy(1);
    await getBasicStats().setCoin(0);
    getButtonPanel().clear_buttons();
  }
  async start_turn() {
    this.phase = PHASE_START_TURN;

    /*
        if(this.ordinal_number === 0){
            this.turn += 1;
        }
            */
    getGameState().update_state();
    this.turn += 1;

    //this.move += 1;

    //this.can_not_be_attacked = false;
    this.unaffected_id_list = [];
    await this.update_score();

    clear_indent();
    getLogger().writeMessage("TURN " + this.turn + ":");
    getGameState().new_turn();
    indent_();
    //play all remaining duration/set aside cards
    await reactionEffectManager.solve_cards_at_start_turn();

    this.start_action_phase();
  }
  async start_extra_turn() {
    this.phase = PHASE_START_TURN;
    this.extra_turn.currentlyInExtraTurn = true;
    //this.move += 1; TODO
    //this.can_not_be_attacked = false;
    this.unaffected_id_list = [];

    clear_indent();
    getLogger().writeMessage("EXTRA TURN :");
    getGameState().new_turn();
    indent_();
    //play all remaining duration/set aside cards
    await reactionEffectManager.solve_cards_at_start_turn();
    getGameState().update_state();
    this.start_action_phase();
  }
  start_action_phase() {
    this.phase = PHASE_ACTION;
    clear_indent();
    indent_();
    getLogger().writeMessage("ACTION PHASE:");
    indent_();

    audioManager.playSound("yourTurn");
    this.update_action_phase();
  }
  async start_buy_phase() {
    this.phase = PHASE_BUY;
    this.can_play_treasure_buy_phase = true;

    clear_indent();
    indent_();
    getLogger().writeMessage("BUY PHASE:");
    indent_();
    audioManager.playSound("yourTurn");

    await reactionEffectManager.solve_cards_at_start_buy_phase();
    await this.update_buy_phase();
  }
  start_night_phase() {
    if (!getHand().has_card((c) => c.type.includes("Night"))) {
      this.start_clean_up_phase();
      return;
    }
    this.phase = PHASE_NIGHT;
    clear_indent();
    indent_();
    getLogger().writeMessage("NIGHT PHASE:");
    indent_();

    audioManager.playSound("yourTurn");
    this.update_night_phase();
  }
  async start_clean_up_phase() {
    this.phase = PHASE_CLEAN_UP;
    await reactionEffectManager.solve_cards_at_start_cleanup_phase();

    if (getHand().length() > 0 || getPlayField().length() > 0) {
      while (getHand().length() > 0) {
        await getDiscard().addCard(await getHand().pop());
      }
      while (getPlayField().length() > 0) {
        //TODO: Discard from play
        let card = await getPlayField().getCardAll()[0];
        if (card.not_discard_in_cleanup) {
          await getPlayField().remove(card);
          await getPlayArea().addCard(card);
        } else {
          await discardCardFromPlayField(card);
        }
      }
    }
    if (!this.extra_turn.playExtraTurn) {
      await drawNCards(5);
    }

    if (
      getBasicStats().getDebt() > 0 &&
      getBasicStats().getCoin() + getBasicStats().getCoffer() > 0
    )
      await may_payoff_debt();
    await this.end_turn();
  }
  // UPDATE PHASES
  async update_action_phase() {
    if (this.phase !== PHASE_ACTION) {
      await this.continue_phase();
      return;
    }
    if (getBasicStats().getAction() <= 0) {
      await this.start_buy_phase();
      return;
    }
    /*
        if(!getHand().has_card(card => card.type.includes(Card.Type.ACTION))){
            await this.start_buy_phase();
            return;
        }
            */
    let clearFunc = async function () {
      getButtonPanel().clear_buttons();
      setInstruction("");
      await getHand().remove_mark();

      getSupportHand().clear();
      getSupportHand().hide();
      getDeck().removeCanSelect();
      landscapeEffectManager.remove_mark();
    };
    getButtonPanel().clear_buttons();
    getButtonPanel().add_button(
      "End Action",
      async function () {
        await clearFunc();
        await this.start_buy_phase();
      }.bind(this)
    );

    let mayPlayAction = mayPlayCardFromHand(
      function (card) {
        return card.type.includes(Card.Type.ACTION);
      },
      async function (card) {
        this.move += 1;
        await getBasicStats().setAction(getBasicStats().getAction() - 1);
        await clearFunc();

        await play_card(card);

        getGameState().update_state();
        this.update_action_phase();
      }.bind(this)
    );
    if (!mayPlayAction) {
      clearFunc();
      await this.start_buy_phase();
      return;
    }

    setInstruction("You may play Action");

    landscapeEffectManager.mark_cards(
      function (card) {
        return (
          card.getType().includes("Way") && card.getCard().should_activate_way()
        );
      },
      async function (card) {
        await clearFunc();
        this.move += 1;
        await getBasicStats().setAction(getBasicStats().getAction() - 1);

        await card.activate_way();
        getGameState().update_state();
        await this.update_action_phase();
      }.bind(this)
    );
  }
  async update_buy_phase() {
    if (this.phase !== PHASE_BUY) {
      await this.continue_phase();
      return;
    }
    if (
      (getBasicStats().getDebt() <= 0 && getBasicStats().getBuy() <= 0) ||
      (getBasicStats().getDebt() > 0 &&
        getBasicStats().getCoin() + getBasicStats().getCoffer() <= 0 &&
        !this.can_play_treasure_buy_phase)
    ) {
      await this.end_buy_phase();
      return;
    }
    let clearFunc = function () {
      getButtonPanel().clear_buttons();
      setInstruction("");
      getHand().remove_mark();
      removeMarkSupplyPile();
      landscapeEffectManager.remove_mark();
      hide_number_picker();
    };
    getButtonPanel().clear_buttons();
    getButtonPanel().add_button(
      "End Buy",
      async function () {
        clearFunc();
        await this.end_buy_phase();
      }.bind(this)
    );

    if (this.can_play_treasure_buy_phase) {
      let contain_treasure = getHand().mark_cards(
        (card) => card.type.includes("Treasure"),
        async function (card) {
          this.move += 1;
          clearFunc();

          await getHand().remove(card);
          await play_card(card);

          getGameState().update_state();
          this.update_buy_phase();
        }.bind(this),
        "choose"
      );
      //Autoplay Treasure button
      if (
        contain_treasure &&
        getHand().has_card((c) =>
          ["Copper", "Silver", "Gold", "Platinum"].includes(c.name)
        )
      ) {
        getButtonPanel().add_button(
          "Autolay Treasures",
          async function () {
            this.move += 1;
            clearFunc();
            await autoplay_treasures();

            getGameState().update_state();
            await this.update_buy_phase();
          }.bind(this)
        );
      }
    }
    if (getBasicStats().getDebt() > 0) {
      await may_payoff_debt();
      clearFunc();

      if (getBasicStats().getDebt() > 0) {
        clearFunc();
        this.end_buy_phase();
      } else {
        await this.update_buy_phase();
      }
    } else {
      setInstruction("You may buy card");
      let buyGainCardFromPile = async function (pile) {
        this.move += 1;
        this.can_play_treasure_buy_phase = false;
        clearFunc();

        await buy_and_gain_card(pile);
        getGameState().update_state();
        await this.update_buy_phase();
      }.bind(this);
      let decideToGainAnimalFair = function (pile) {
        if (
          !(
            pile.getName() === "AnimalFair" &&
            getHand().has_card((card) => card.type.includes(Card.Type.ACTION))
          )
        )
          return;

        return new Promise((resolve) => {
          let clearFunc0 = function () {
            getHand().remove_mark();
            getButtonPanel().clear_buttons();
            setInstruction("");
          };
          getButtonPanel().clear_buttons();
          setInstruction("You may trash an Action card to buy Animal Fair.");

          getHand().mark_cards(
            (card) => card.type.includes(Card.Type.ACTION),
            async function (card) {
              clearFunc0();
              await trash_card(card);

              this.move += 1;
              await getBasicStats().addBuy(-1);
              await gain_card(pile);
              getGameState().update_state();
              this.update_buy_phase();
              resolve();
            }.bind(this),
            "trash"
          );

          let cost = new Cost(
            getBasicStats().getCoin() + getBasicStats().getCoffer()
          );
          if (cost.sufficientToBuy(pile.getCost())) {
            getButtonPanel().add_button("Pay to gain", async function () {
              clearFunc0();
              await buyGainCardFromPile(pile);
              resolve();
            });
          }
        });
      }.bind(this);
      markSupplyPile(
        function (pile) {
          let basicStats = getBasicStats(),
            cost = new Cost(basicStats.getCoin() + basicStats.getCoffer());
          if (this.can_not_buy_action_this_turn) {
            return (
              pile.getQuantity() > 0 &&
              cost.sufficientToBuy(pile.getCost()) &&
              !pile.getType().includes("Action")
            );
          } else {
            return (
              pile.getQuantity() > 0 &&
              (cost.sufficientToBuy(pile.getCost()) ||
                (pile.getName() === "AnimalFair" &&
                  getHand().has_card((card) =>
                    card.type.includes(Card.Type.ACTION)
                  )))
            );
          }
        }.bind(this),
        async function (pile) {
          if (
            pile.getName() === "AnimalFair" &&
            getHand().has_card((card) => card.type.includes(Card.Type.ACTION))
          ) {
            clearFunc();
            await decideToGainAnimalFair(pile);
          } else {
            await buyGainCardFromPile(pile);
          }
        }.bind(this)
      );
      landscapeEffectManager.mark_cards(
        function (landscape_card) {
          let cost = new Cost(
            getBasicStats().getCoin() + getBasicStats().getCoffer()
          );
          return (
            (landscape_card.getType().includes("Event") ||
              landscape_card.getType().includes("Project")) &&
            cost.sufficientToBuy(landscape_card.getCost())
          );
        },
        async function (card) {
          clearFunc();

          this.move += 1;
          this.can_play_treasure_buy_phase = false;
          await buy_landscape_card(card);

          getGameState().update_state();
          this.update_buy_phase();
        }.bind(this)
      );
    }
  }
  update_night_phase() {
    if (this.phase !== PHASE_NIGHT) {
      this.continue_phase(); //await ?
      return;
    }
    let clearFunc = function () {
      getButtonPanel().clear_buttons();
      setInstruction("");
      getHand().remove_mark();
    };
    getButtonPanel().clear_buttons();
    getButtonPanel().add_button(
      "End Night",
      function () {
        clearFunc();
        this.end_night_phase();
      }.bind(this)
    );

    let contain_night = getHand().mark_cards(
      function (card) {
        return card.type.includes("Night");
      },
      async function (card) {
        this.move += 1;
        clearFunc();
        await getHand().remove(card);
        await play_card(card);
        getGameState().update_state();
        this.update_night_phase();
      }.bind(this)
    );
    if (!contain_night) {
      clearFunc();
      this.end_night_phase();
    } else {
      setInstruction("You may play Night card");
    }
  }

  async end_buy_phase() {
    await reactionEffectManager.solve_cards_at_end_buy_phase();
    deindent();
    this.start_night_phase();
  }
  end_night_phase() {
    deindent();
    this.start_clean_up_phase();
  }
  async end_turn() {
    this.phase = PHASE_END_TURN;
    this.can_not_buy_action_this_turn = false;
    this.attacked_by_envious = false;
    this.is_attacked_by_enchantress = false;
    await reactionEffectManager.solve_cards_at_end_turn();
    HexBoonManager.returnAllBoon();

    await getBasicStats().setAction(1);
    await getBasicStats().setBuy(1);
    await getBasicStats().setCoin(0);
    getBasicStats().ignoreAddActionsThisTurn = false; // Use for SnowyVillage

    if (this.extra_turn.playExtraTurn) {
      if (this.extra_turn.cardsCauseExtraTurn.length > 0) {
        let card = this.extra_turn.cardsCauseExtraTurn.pop();
        this.extra_turn.cannotPlayExtraTurnByCards = true;
        this.extra_turn.cardsCauseExtraTurn = [];
        if (
          this.extra_turn.Fleet == null &&
          this.extra_turn.SeizeTheDay == null &&
          this.extra_turn.cardsCauseExtraTurn.length === 0 &&
          this.extra_turn.possession == null
        ) {
          this.extra_turn.playExtraTurn = false;
          this.extra_turn.cannotPlayExtraTurnByCards = false;
        }
        if (card.playExtraTurn) {
          await card.playExtraTurn();
          await this.start_extra_turn();
        }
      }
    } else {
      this.extra_turn.playExtraTurn = false;
      this.extra_turn.cannotPlayExtraTurnByCards = false;
      await this.should_game_finish();

      //await this.start_waiting_phase();
    }
  }
  async should_game_finish() {
    let empty_basic = getBasicSupply().pile_list.filter(
      (pile) => pile.getQuantity() <= 0
    );
    let empty_kingdom = getKingdomSupply().pile_list.filter(
      (pile) => pile.getQuantity() <= 0
    );
    let empty_supply_piles_count = empty_basic.length + empty_kingdom.length;

    let colony_pile = findSupplyPile((pile) => pile.getName() === "Colony");

    let province_pile = findSupplyPile((pile) => pile.getName() === "Province");

    if (
      empty_supply_piles_count >= 3 ||
      colony_pile.getQuantity() <= 0 ||
      province_pile.getQuantity() <= 0
    ) {
      this.end_game();
    } else {
      await this.start_waiting_phase();
    }
  }
  end_game() {
    if (this.phase === PHASE_END_GAME) return;

    let isWinner = false;

    if (opponentManager.getOpponentList().length === 0) {
      isWinner = true;
    } else {
      isWinner = true;
      var totalScore =
        getBasicStats().getScore() + getBasicStats().getVictoryToken();
      for (let opponent of opponentManager.getOpponentList()) {
        if (opponent.score + opponent.victory_token > totalScore) {
          isWinner = false;
          break;
        }
      }
    }

    if (isWinner) {
      audioManager.playSound("win");
      openResultBoard(isWinner);
    } else {
      audioManager.playSound("gameOver");
      openResultBoard(isWinner);
    }

    alert("TADA, GAME END!!");
    this.notify_end_game();
    this.phase = PHASE_END_GAME;
  }
}
function getPlayer() {
  return player;
}
export { Player, getPlayer };
