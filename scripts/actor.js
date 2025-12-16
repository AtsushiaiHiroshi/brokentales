/**
 * Clase base de Actor para Broken Tales
 */
export class PBTAActor extends Actor {
  /** @override */
  prepareData() {
    super.prepareData();
    const actorData = this.data;

    if (actorData.type === "character" || actorData.type === "npc") {
      // Inicializar atributos si no existen
      actorData.data.attributes = actorData.data.attributes || {};
      actorData.data.attributes.soma = actorData.data.attributes.soma || { current: 0, max: 6 };
      actorData.data.attributes.wounds = actorData.data.attributes.wounds || { 
        current: 0, 
        max: 3,
        extra: {
          value: 0,
          max: 1
        }
      };
      
      // Comprobar condición de muerte
      const wounds = actorData.data.attributes.wounds;
      if (wounds.current >= wounds.max && wounds.extra.value >= wounds.extra.max) {
        actorData.data.status = "dead";
        ui.notifications.error("¡El personaje ha muerto!");
      }
    }
  }

  /** @override */
  async update(data, options={}) {
    // Validar límites de heridas
    if (hasProperty(data, "data.attributes.wounds.current")) {
      const wounds = data.data.attributes.wounds;
      if (wounds.current > wounds.max) {
        wounds.current = wounds.max;
      }
    }

    // Validar límites de soma
    if (hasProperty(data, "data.attributes.soma.current")) {
      const soma = data.data.attributes.soma;
      if (soma.current > soma.max) {
        soma.current = soma.max;
      }
      if (soma.current < 0) {
        soma.current = 0;
      }
    }

    return super.update(data, options);
  }

  /**
   * Método auxiliar para añadir heridas
   * @param {number} amount - Cantidad de heridas a añadir
   * @param {boolean} isExtra - Si es una herida extra
   */
  async addWound(amount = 1, isExtra = false) {
    const wounds = this.data.data.attributes.wounds;
    
    if (!isExtra) {
      let newWounds = wounds.current + amount;
      if (newWounds > wounds.max) {
        const overflow = newWounds - wounds.max;
        await this.update({"data.attributes.wounds.current": wounds.max});
        if (overflow > 0) {
          await this.addWound(overflow, true);
        }
      } else {
        await this.update({"data.attributes.wounds.current": newWounds});
      }
    } else {
      let newExtra = wounds.extra.value + amount;
      if (newExtra > wounds.extra.max) {
        newExtra = wounds.extra.max;
      }
      await this.update({"data.attributes.wounds.extra.value": newExtra});
    }
  }

  /**
   * Método auxiliar para gastar Soma
   * @param {number} amount - Cantidad de Soma a gastar
   */
  async spendSoma(amount = 1) {
    const soma = this.data.data.attributes.soma;
    const newValue = Math.max(0, soma.current - amount);
    await this.update({"data.attributes.soma.current": newValue});
    return newValue;
  }
}

// Configuración global
CONFIG.Actor.documentClass = PBTAActor;
CONFIG.Actor.types = ["character", "npc"];

import { BrokenTalesCharacterSheet } from "./character-sheet.js";
import { BrokenTalesNPCSheet } from "./npc-sheet.js";

export function registerActorSheets() {
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("brokentales", BrokenTalesCharacterSheet, {
    types: ["character"],
    makeDefault: true
  });
  Actors.registerSheet("brokentales", BrokenTalesNPCSheet, {
    types: ["npc"],
    makeDefault: true
  });
}
