import {
    Animation,
    Axis,
    Mesh,
    Observable,
    Quaternion,
    Scene,
    Vector3,
} from "@babylonjs/core";

import { Preloader } from "./utils/Preloader.js";

/** Axis for animations. */
export type AnimationAxis = "x" | "y" | "z";

/** The current position of the block. */
export enum BlockState {
    /** The block is motionless. */
    STATE_STAND = 0,
    /**
     * The block is crouched and takes 2 squares in width and 1 in height.
     * [ ][ ]
     */
    STATE_CROUCH_WIDTH = 1,
    /**
     * The block is crouched and takes 1 square in width and 2 in height.
     * [ ]
     * [ ]
     */
    STATE_CROUCH_HEIGHT = 2,
}

export enum Direction {
    TOP,
    BOT,
    RIGHT,
    LEFT,
}

export class Block extends Mesh {
    speed: number = 10;
    isMoving: boolean = false;
    isFalling: boolean = false;
    blockState: number = BlockState.STATE_STAND;

    onTurnEndObservable: Observable<void> = new Observable();

    constructor(loader: Preloader, scene?: Scene) {
        super("player", scene);

        const b = loader.assets["block"].meshes as Mesh[];
        b[0].parent = this;
        b[0].isVisible = true;
        b[0].convertToFlatShadedMesh();
        b[0].scaling.multiplyInPlace(new Vector3(0.01, 0.01, 0.01));

        this.position.y = -99;
        this.rotationQuaternion = new Quaternion(0, 0, 0, 1);
        this.rotation = Vector3.Zero();

        scene?.registerBeforeRender(() => {
            if (this.isFalling) {
                this.position.y -= 0.1 * 6;
            }
        });
    }

    animateTranslation(axis: AnimationAxis, distance: number, yvalue: number) {
        const start = this.position.clone();
        const end = this.position.clone();
        switch (axis) {
            case "x":
                end.x += distance;
                end.y = yvalue;
                break;
            case "z":
                end.y = yvalue;
                end.z += distance;
                break;
        }

        const translate = new Animation(
            "move",
            "position",
            60,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const keys = [
            {
                frame: 0,
                value: start,
            },
            {
                frame: 100,
                value: end,
            }
        ];

        translate.setKeys(keys);
        this.animations.push(translate);
        this._scene.beginAnimation(this, 0, 100, false, this.speed);
    }

    animateRotation(axis: Vector3, angle: number) {
        const rotationQuaternion = Quaternion.RotationAxis(axis, angle);
        const end = rotationQuaternion.multiply(this.rotationQuaternion!);
        const start = this.rotationQuaternion;

        const rotation = new Animation(
            "rotation",
            "rotationQuaternion",
            60,
            Animation.ANIMATIONTYPE_QUATERNION,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const keys = [
            {
                frame: 0,
                value: start,
            }, {
                frame: 100,
                value: end,
            }
        ];

        rotation.setKeys(keys);
        this.animations.push(rotation);
        this._scene.beginAnimation(this, 0, 100, false, this.speed, () => {
            this._endRotationAnimation();
        });
    }

    handleUserInput(key: string) {
        if (this.isMoving === true || this.isFalling === true) {
            // Do nothing while the block is moving.
            return;
        }

        switch (key) {
            case "ArrowUp":
                {
                    // Top
                    const res = this._getMovingDistance(Direction.TOP);
                    this.isMoving = true;
                    this._setNewState(Direction.TOP);
                    this.animateTranslation("x", res.distance * -1, res.yvalue);
                    this.animateRotation(Axis.Z, Math.PI / 2);
                }
                break;
            case "ArrowDown":
                {
                    // Bottom
                    const res = this._getMovingDistance(Direction.BOT);
                    this.isMoving = true;
                    this._setNewState(Direction.BOT);
                    this.animateTranslation("x", res.distance, res.yvalue);
                    this.animateRotation(Axis.Z, -Math.PI / 2);
                }
                break;
            case "ArrowLeft":
                {
                    // Left
                    const res = this._getMovingDistance(Direction.LEFT);
                    this.isMoving = true;
                    this._setNewState(Direction.LEFT);
                    this.animateTranslation("z", res.distance * -1, res.yvalue);
                    this.animateRotation(Axis.X, -Math.PI / 2);
                }
                break;
            case "ArrowRight":
                {
                    // Right
                    const res = this._getMovingDistance(Direction.RIGHT);
                    this._setNewState(Direction.RIGHT);
                    this.animateTranslation("z", res.distance, res.yvalue);
                    this.animateRotation(Axis.X, Math.PI / 2);
                }
                break;
        }
    }

    resetState() {
        this.blockState = BlockState.STATE_STAND;
        this.isMoving = false;
        this.isFalling = false;
        this.position.y = -99;
        this.rotationQuaternion = new Quaternion(0, 0, 0, 1);
        this.rotation = Vector3.Zero();
    }

    /**
     * Function called when the rotation animation is over.
     * Check if the box is flying
     */
    private _endRotationAnimation() {
        // The box is not moving anymore
        this.isMoving = false;

        // End this turn
        this.onTurnEndObservable.notifyObservers();
    }

    private _getMovingDistance(direction: Direction) {
        let d = 0;
        let y = 0;
        switch (this.blockState) {
            case BlockState.STATE_STAND:
                d = 1.5;
                // from stand to crouch : y = 0.5
                y = 0.5;
                break;
            case BlockState.STATE_CROUCH_WIDTH:
                if (direction === Direction.RIGHT || direction === Direction.LEFT) {
                    // from crouch to stand
                    d = 1.5;
                    y = 1;
                } else {
                    // from crouch to crouch
                    d = 1;
                    y = 0.5;
                }
                break;
            case BlockState.STATE_CROUCH_HEIGHT:
                if (direction === Direction.RIGHT || direction === Direction.LEFT) {
                    // from crouch to crouch
                    d = 1;
                    y = 0.5;
                } else {
                    // from crouch to stand
                    d = 1.5;
                    y = 1;
                }
                break;
        }
        return {
            distance: d,
            yvalue: y
        };
    }

    /**
     * Set the new state of the block after a move.
     */
    private _setNewState(direction: Direction) {
        switch (this.blockState) {
            case BlockState.STATE_STAND:
                if (direction === Direction.RIGHT || direction === Direction.LEFT) {
                    this.blockState = BlockState.STATE_CROUCH_WIDTH;
                } else if (direction === Direction.TOP || direction === Direction.BOT) {
                    this.blockState = BlockState.STATE_CROUCH_HEIGHT;
                }
                break;
            case BlockState.STATE_CROUCH_WIDTH:
                if (direction === Direction.RIGHT || direction === Direction.LEFT) {
                    this.blockState = BlockState.STATE_STAND;
                } else if (direction === Direction.TOP || direction === Direction.BOT) {
                    this.blockState = BlockState.STATE_CROUCH_WIDTH;
                }
                break;
            case BlockState.STATE_CROUCH_HEIGHT:
                if (direction === Direction.RIGHT || direction === Direction.LEFT) {
                    this.blockState = BlockState.STATE_CROUCH_HEIGHT;
                } else if (direction === Direction.TOP || direction === Direction.BOT) {
                    this.blockState = BlockState.STATE_STAND;
                }
                break;
        }
    }
}
