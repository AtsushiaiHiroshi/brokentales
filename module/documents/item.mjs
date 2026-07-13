export class BrokenTalesItem extends Item {
  get isDescriptor() {
    return this.type === "descriptor";
  }

  get isGift() {
    return this.type === "gift";
  }
}
