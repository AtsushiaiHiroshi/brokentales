const fields = foundry.data.fields;

class BrokenTalesActorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      details: new fields.SchemaField({
        concept: new fields.StringField({ initial: "" }),
        origin: new fields.StringField({ initial: "" }),
        role: new fields.StringField({ initial: "" }),
        notes: new fields.HTMLField({ initial: "" })
      }),
      resources: new fields.SchemaField({
        soma: new fields.SchemaField({
          value: new fields.NumberField({ initial: 5, integer: true, min: 0 }),
          max: new fields.NumberField({ initial: 5, integer: true, min: 0 })
        }),
        xp: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
        wounds: new fields.SchemaField({
          value: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          max: new fields.NumberField({ initial: 3, integer: true, min: 0 })
        }),
        darkness: new fields.SchemaField({
          value: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          max: new fields.NumberField({ initial: 6, integer: true, min: 0 })
        })
      }),
      opposition: new fields.SchemaField({
        defaultLevel: new fields.NumberField({ initial: 5, integer: true, min: 1 }),
        modifier: new fields.NumberField({ initial: 0, integer: true })
      }),
      bookmark: new fields.SchemaField({
        wound1: new fields.StringField({ initial: "" }),
        wound2: new fields.StringField({ initial: "" }),
        wound3: new fields.StringField({ initial: "" }),
        extraWound: new fields.StringField({ initial: "" })
      })
    };
  }
}

export class HunterData extends BrokenTalesActorData {}
export class NPCData extends BrokenTalesActorData {}

export class EssenceData extends BrokenTalesActorData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      essence: new fields.SchemaField({
        nature: new fields.StringField({ initial: "" }),
        anchor: new fields.StringField({ initial: "" }),
        manifestation: new fields.HTMLField({ initial: "" })
      })
    };
  }
}

export class VillagerData extends BrokenTalesActorData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      villager: new fields.SchemaField({
        age: new fields.StringField({ initial: "" }),
        bond: new fields.StringField({ initial: "" }),
        contact: new fields.HTMLField({ initial: "" }),
        distinguishingFeatures: new fields.HTMLField({ initial: "" })
      })
    };
  }
}

export class ThreatData extends BrokenTalesActorData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      threat: new fields.SchemaField({
        rank: new fields.StringField({ initial: "Medium 5" }),
        impulse: new fields.StringField({ initial: "" }),
        oppositionLevel: new fields.NumberField({ initial: 5, integer: true, min: 1 })
      })
    };
  }
}

class BrokenTalesItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ initial: "" }),
      notes: new fields.StringField({ initial: "" }),
      key: new fields.StringField({ initial: "" }),
      owner: new fields.StringField({ initial: "" }),
      category: new fields.StringField({ initial: "" }),
      source: new fields.StringField({ initial: "" })
    };
  }
}

export class DescriptorData extends BrokenTalesItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      positive: new fields.StringField({ initial: "" }),
      negative: new fields.StringField({ initial: "" }),
      exhausted: new fields.BooleanField({ initial: false }),
      xpMarked: new fields.BooleanField({ initial: false }),
      specialization: new fields.BooleanField({ initial: false }),
      sceneUsed: new fields.BooleanField({ initial: false })
    };
  }
}

export class GiftData extends BrokenTalesItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      somaCost: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      automaticSuccesses: new fields.NumberField({ initial: 0, integer: true, min: 0 })
    };
  }
}

export class DarkEgoData extends BrokenTalesItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      somaCost: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      automaticSuccesses: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
      trigger: new fields.StringField({ initial: "" })
    };
  }
}

export class EquipmentData extends BrokenTalesItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      quantity: new fields.NumberField({ initial: 1, integer: true, min: 0 })
    };
  }
}

export class ConditionData extends BrokenTalesItemData {}
export class WoundData extends BrokenTalesItemData {}
export class StoryElementData extends BrokenTalesItemData {}
