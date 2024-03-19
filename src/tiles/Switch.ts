import { Tile } from "./Tile.js";
import { Block } from "../Block.js";

export class Switch extends Tile {
    /** The tiles to open when the switch is activated. */
    tilesToOpen: Tile[] = [];

    action(_player: Block) {
        this.tilesToOpen.forEach((t) => {
            t.setVisible(!t.isVisible);
        })
    }
}
