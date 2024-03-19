import {
    ArcRotateCamera,
    Color3,
    Color4,
    Engine,
    HemisphericLight,
    MeshBuilder,
    Scene,
    ShaderMaterial,
    Vector3,
    setAndStartTimer,
} from "@babylonjs/core";

import { Block } from "./Block.js";
import { Level } from "./Level.js";
import { Preloader } from "./utils/Preloader.js";
import { getTileOfBlock, isOnFinish, isOnGround } from "./utils/utils.js";
import { levels, Level as GameLevel } from "./maps/level1.js";

export class Game {
    engine: Engine;
    scene: Scene;
    levels: GameLevel[];
    currentLevel: number;
    nbTurn: number;
    loader: Preloader;
    player!: Block;
    level!: Level;
    private _loadingEl: HTMLElement;
    private _nbTurnEl: HTMLElement;
    private _textEl: HTMLElement;

    constructor(canvasId: string) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            throw new Error("Canvas not found");
        }
        this.engine = new Engine(canvas, true);
        this.scene = this._initScene(this.engine);

        this.currentLevel = 0;
        this.levels = levels;
        this.nbTurn = 0;
        this.loader = new Preloader("assets/", this.scene);
        this._loadingEl = document.getElementById("loadingWrapper")!;
        this._nbTurnEl = document.getElementById("nbTurn")!;
        this._textEl = document.getElementById("text")!;
    }

    start() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener("resize", () => {
            if (this.engine) {
                this.engine.resize();
            }
        }, false);

        this.loader.onSuccessObservable.add(this._notify.bind(this));
        this.loader.add("block", "", "block02.babylon");
        this.loader.add("tile", "", "tile_standard.babylon");
        this.loader.add("ender", "", "tile.babylon");
        this.loader.add("switch", "", "tile_final.babylon");
        this.loader.add("teleporter", "", "teleporter.babylon");
        this.loader.start();
    }

    private _notify() {
        this.player = new Block(this.loader, this.scene);
        this.player.onTurnEndObservable.add(this.turn.bind(this));

        this._loadingEl.style.transform = "translateX(-300%)";
        this.startLevel(this.currentLevel);
    }

    private _initScene(engine: Engine) {
        const scene = new Scene(engine);

        // Camera attached to the canvas
        const camera = new ArcRotateCamera("Camera", 0, Math.PI / 5, 10, Vector3.Zero(), scene);
        camera.maxZ = 1000;

        // Update the scene background color
        scene.clearColor = Color4.FromColor3(new Color3(0.8, 0.8, 0.8));

        // Hemispheric light to light the scene
        new HemisphericLight("hemi", new Vector3(1, 2, 1), scene);

        // Skydome
        const skybox = MeshBuilder.CreateSphere("skyBox", {
            segments: 50,
            diameter: 1000,
        }, scene);

        Engine.ShadersRepository = "shaders/";

        const shader = new ShaderMaterial("gradient", scene, "gradient", {});
        shader.setFloat("offset", 200);
        shader.setColor3("topColor", Color3.FromInts(0, 119, 255));
        shader.setColor3("bottomColor", Color3.FromInts(240, 240, 255));
        shader.backFaceCulling = false;
        skybox.material = shader;

        return scene;
    }

    /**
     * Function called by the Block when a movement is finished.
     */
    turn() {
        this.nbTurn++;
        this._nbTurnEl.innerText = String(this.nbTurn);

        const blocks = getTileOfBlock(this.player, this.level);

        if (blocks.length == 1) {
            blocks[0].action(this.player);
        }

        // Check if the block is falling
        if (!isOnGround(this.player, this.level)) {
            this.player.isFalling = true;

            setAndStartTimer({
                timeout: 1200,
                contextObservable: this.scene.onBeforeRenderObservable,
                onEnded: () => {
                    // Restart.
                    this.startLevel(this.currentLevel);
                },
            });
        }
        if (isOnFinish(this.player, this.level)) {
            // WIN!
            this.currentLevel++;
            if (this.currentLevel >= this.levels.length) {
                this.finish();
            } else {
                this.startLevel(this.currentLevel);
            }

        }
    }

    finish() {
        this.engine.stopRenderLoop();
        document.getElementById("game")!.style.display = "none";
        document.getElementById("renderCanvas")!.style.display = "none";
        document.getElementById("finish")!.style.display = "block";
    }

    handleUserInput(key: string) {
        switch (key) {
            case "r":
                // R - restart the game.
                this.startLevel(this.currentLevel);
                break;
        }
    }

    /**
     * Start the level given in parameter.
     * @param level
     */
    startLevel(level: number) {
        if (this.level) {
            this.level.dispose();
        }

        this.level = Level.FromInts(this.levels[level].matrix, this.loader, this.scene);
        this._textEl.innerText = this.levels[level].text;
        this._textEl.style.opacity = "1";

        this.player.resetState();
        this.player.position.x = this.level.start.x;
        this.player.position.z = this.level.start.y;

        //this.player.position.x += 0.5;
        //this.player.position.y += 0.5;

        const time = this.level.width * this.level.height * 20;
        setAndStartTimer({
            timeout: time,
            contextObservable: this.scene.onBeforeRenderObservable,
            onEnded: () => {
                window.addEventListener("keyup", (evt) => {
                    this.player.handleUserInput(evt.key);
                    this.handleUserInput(evt.key);
                });
            },
        });

        // Camera target
        const c = this.level.getCenter();
        const d = this.level.getDistance() * 1.1;
        (this.scene!.activeCamera as ArcRotateCamera).target = new Vector3(c.x, 1, c.y);
        (this.scene!.activeCamera as ArcRotateCamera).radius = d;

        this.level.display();
    }
}
