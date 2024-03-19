import {
    Animation,
    Color3,
    CreateBoxVertexData,
    Mesh,
    Scene,
    StandardMaterial,
    Texture,
} from "@babylonjs/core";

import { Preloader } from "../utils/Preloader.js";
import type { Block } from "../Block.js";

/**
 * The different kinds of tiles.
 * A switch must be >= 10.
 */
export enum Type {
    NOTHING = 0,
    NORMAL = 1,
    START = 2,
    FINISH = 3,
}

export class Tile extends Mesh {
    private _type: Type;

    constructor(i: number, j: number, type: Type, loader: Preloader, scene?: Scene) {
        super("tile", scene);

        if (loader.assets["switch"] && Tile.isSwitch(type)) {
            const b = loader.assets["switch"].meshes[0].clone("switchMesh", null)!;
            b.parent = this;
            b.isVisible = true;
            // b.convertToFlatShadedMesh();
        } else if (loader.assets["ender"] && type == Type.FINISH) {
            const b = loader.assets["ender"].meshes[0].clone("enderMesh", null)!;
            b.parent = this;
            b.isVisible = true;
            // b.convertToFlatShadedMesh();
        } else if (loader.assets["teleporter"] && Tile.isTeleporter(type)) {
            const b = loader.assets["teleporter"].meshes[0].clone("teleporterMesh", null)!;
            b.parent = this;
            b.isVisible = true;
            // b.convertToFlatShadedMesh();
        } else if (loader.assets["tile"]) {
            const b = loader.assets["tile"].meshes[0].clone("tileMesh", null)!;
            b.parent = this;
            b.isVisible = true;
            // b.convertToFlatShadedMesh();
        } else {
            const vd = CreateBoxVertexData({ size: 0.9 });
            vd.applyToMesh(this, false);

            this.scaling.y = 0.1;

            const mat = new StandardMaterial("ground", scene);
            const t = new Texture("img/ground3.jpg", scene);
            mat.diffuseTexture = t;
            mat.specularColor = Color3.Black();
            this.material = mat;
        }

        this.position.x = i;
        this.position.y = -50;
        this.position.z = j;

        this._type = type;
    }

    get type() {
        return this._type;
    }

    /** Animate this tile. */
    display() {
        const scene = this.getScene();
        const start = this.position.clone();
        const end = this.position.clone();

        end.y = 0;

        // Create the Animation object.
        const display = new Animation(
            "bounce",
            "position",
            60,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        // Animations keys
        const keys = [
            {
                frame: 0,
                value: start
            },
            {
                frame: 100,
                value: end
            }
        ];

        // Add these keys to the animation
        display.setKeys(keys);

        // Link the animation to the mesh
        this.animations.push(display);

        scene.beginAnimation(this, 0, 100, false, 2);
    }

    /**
     * The action done when the player stand on this tile.
     */
    action(_player: Block) {}

    setVisible(b: boolean) {
        this.isVisible = b;

        this.getChildren().forEach((c) => {
            (c as Mesh).isVisible = b;
        })
    }

    /**
     * Returns true if the type given in parameter is a switch
     * @param type The type of the tile
     * @returns {boolean} True if the type is >= 10
     */
    static isSwitch(type: number): boolean {
        return type >= 10 && type < 20;
    }

    /** Returns true if the type given in parameter is a teleporter. */
    static isTeleporter(type: number) {
        return type >= 20;
    }
}
