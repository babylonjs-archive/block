import {
    Scene,
    Vector2,
    setAndStartTimer,
} from "@babylonjs/core";

import { Ender } from "./tiles/Ender";
import { Preloader } from "./utils/Preloader.js";
import { Switch } from "./tiles/Switch.js"
import { Teleporter } from "./tiles/Teleporter.js";
import { Tile, Type } from "./tiles/Tile.js";

export class Level {
    switches: Switch[];
    tiles: Array<Tile[]>;
    start: Vector2;
    finish: Vector2;

    constructor(
        public width: number,
        public height: number,
        protected loader: Preloader,
        protected scene?: Scene
    ) {
        // The starting position in this level
        this.start = Vector2.Zero();
        // The finish point in this level
        this.finish = Vector2.Zero();

        this.tiles = [];
        this.switches = [];
        for (let i = 0; i < width; i++) {
            this.tiles[i] = [];
        }
    }

    addTile(i: number, j: number, type: Type) {
        this.tiles[i][j] = new Tile(i, j, type, this.loader, this.scene);
    }

    addSwitch(i: number, j: number, type: Type) {
        const s = new Switch(i, j, type, this.loader, this.scene);
        this.switches.push(s);
        this.tiles[i][j] = s;
    }

    addTeleporter(i: number, j: number, type: Type) {
        const s = new Teleporter(i, j, type, this.loader, this.scene);
        this.tiles[i][j] = s;
        return s;
    }

    addEnder(i: number, j: number, type: Type) {
        this.tiles[i][j] = new Ender(i, j, type, this.loader, this.scene);
    }

    /**
     * Delete the current level.
     */
    dispose() {
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                if (this.tiles[i][j]) {
                    this.tiles[i][j].dispose();
                }
            }
        }
    }

    getTile(i: number, j: number) {
        if (i >= 0 && i < this.width && j >= 0 && j < this.height) {
            return this.tiles[i][j];
        } else {
            return null;
        }
    }

    /**
     * Returns the point at the center of the level.
     */
    getCenter() {
        return new Vector2(this.width / 2, this.height / 2);
    }

    /**
     * Returns the distance needed to see the whole level.
     */
    getDistance() {
        return Math.max(this.width + 2, this.height + 2);
    }

    display() {
        const tiles: Tile[] = [];
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                if (this.tiles[i][j]) {
                    tiles.push(this.tiles[i][j]);
                }
            }
        }

        let time = 0;
        for (const tile of tiles) {
            setAndStartTimer({
                timeout: time,
                contextObservable: this.scene!.onBeforeRenderObservable,
                onEnded: () => {
                    tile.display();
                },
            });
            time += 25;
        }
    }

    /**
     * Creates a new map from a matrix of ints
     * @param matrix a double array of ints. 0 for a tile means no tile
     */
    static FromInts(matrix: Array<number[]>, loader: Preloader, scene?: Scene) {
        const nbL = matrix.length;
        const nbH = matrix[0].length;
        const teleporters: Teleporter[] = [];

        const level = new Level(nbL, nbH, loader, scene);

        for (let i = 0; i < nbL; i++) {
            for (let j = 0; j < nbH; j++) {
                const t = matrix[i][j];

                if (Tile.isSwitch(t)) {
                    // Create new switch in this level
                    level.addSwitch(i, j, t);
                } else if (Tile.isTeleporter(t)) {
                    // Create new switch in this level
                    const tt = level.addTeleporter(i, j, t);
                    teleporters.push(tt);
                } else {
                    switch (t) {
                        case Type.START:
                            level.start = new Vector2(i, j);
                            level.addTile(i, j, t);
                            break;
                        case Type.FINISH:
                            level.finish = new Vector2(i, j);
                            level.addEnder(i, j, t);
                            break;
                        case Type.NOTHING:
                            // Nothing to do here
                            break;
                        case Type.NORMAL:
                        default:
                            level.addTile(i, j, t);
                            break;
                    }
                }
            }
        }

        // Update switches.
        for (const s of level.switches) {
            const res: Tile[] = [];
            for (let i = 0; i < nbL; i++) {
                for (let j = 0; j < nbH; j++) {
                    const t = matrix[i][j];
                    if (t == s.type * -1) {
                        // Add the tile t to the switch
                        const tile = level.getTile(i, j)!;
                        tile.setVisible(false);
                        res.push(tile);
                    }
                }
            }
            s.tilesToOpen = res;
        }

        // Update teleporters.
        for (const s of teleporters) {
            for (let i = 0; i < nbL; i++) {
                for (let j = 0; j < nbH; j++) {
                    const t = matrix[i][j];
                    if (t == s.type * -1) {
                        // Add the tile t to the switch
                        const tile = level.getTile(i, j)!;
                        s.setDestination(tile);
                    }
                }
            }
        }
        return level;
    }
}
