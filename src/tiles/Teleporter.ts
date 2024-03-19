import {
    Color3,
    Texture,
    Scene,
    StandardMaterial,
} from "@babylonjs/core";

import { Block } from "../Block.js";
import { Tile, Type } from "./Tile.js";
import { Preloader } from "../utils/Preloader.js";

export class Teleporter extends Tile {
    private _destination!: Tile;

    constructor(i: number, j: number, type: Type, loader: Preloader, scene?: Scene) {
        super(i, j, type, loader, scene);

        const mat = new StandardMaterial("switch", scene);
        const t = new Texture("img/switch.jpg", scene);
        mat.diffuseTexture = t;
        mat.specularColor = Color3.Black();
        this.material = mat;
    }

    action(player: Block) {
        // teleport the player to the destination
        player.position.x = this._destination.position.x;
        player.position.z = this._destination.position.z;
    }

    setDestination(tile: Tile) {
        this._destination = tile;
    }
}
