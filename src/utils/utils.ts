import { Block, BlockState } from "../Block.js";
import { Level } from "../Level.js";
import { Tile } from "../tiles/Tile.js";

/**
 * Returns the set of tile (0, 1 or 2) where the block is currently
 * @param block
 * @param level
 */
export function getTileOfBlock(block: Block, level: Level) {
    const tiles: Tile[] = [];
    if (block.isMoving) {
        return tiles;
    }
    const pos = block.position;
    switch (block.blockState) {
        case BlockState.STATE_STAND:
            {
                const t = level.getTile(pos.x, pos.z)!;
                if (t) {
                    tiles.push(t);
                }
            }
            break;
        case BlockState.STATE_CROUCH_HEIGHT:
            {
                const t = level.getTile(pos.x - 0.5, pos.z);
                const tt = level.getTile(pos.x + 0.5, pos.z);
                if (t) {
                    tiles.push(t);
                }
                if (tt) {
                    tiles.push(tt);
                }
            }
            break;
        case BlockState.STATE_CROUCH_WIDTH:
            {
                const t = level.getTile(pos.x, pos.z - 0.5);
                const tt = level.getTile(pos.x, pos.z + 0.5);
                if (t) {
                    tiles.push(t);
                }
                if (tt) {
                    tiles.push(tt);
                }
            }
            break;
    }

    return tiles;
}

/**
 * Returns true if the block is on the finish tile, in standing state
 * @param block
 * @param level
 */
export function isOnFinish(block: Block, level: Level) {
    if (block.isMoving || block.isFalling || block.blockState != BlockState.STATE_STAND) {
        return false;
    }

    const pos = block.position;
    const finish = level.finish;

    return (pos.x == finish.x && pos.z == finish.y);
}

/**
 * Returns true if the block is on ground, false otherwise.
 * If the block is moving, return true;
 * The block is considered on ground if :
 * <ul>
 *     <li>The block is standing and its position (x,z) is a tile</li>
 *     <li>The block is CROUCH_WIDTH and its position (x-0.5, z) and (x+0.5,z) are on tiles</li>
 *     <li>The block is CROUCH_HEIGHT and its position (x, z-0.5) and (x,z+0.5) are on tiles</li>
 * </ul>
 * @param block
 * @param level
 */
export function isOnGround(block: Block, level: Level) {
    if (block.isMoving) {
        return true;
    }

    const pos = block.position;
    let res = false;
    switch (block.blockState) {
        case BlockState.STATE_STAND:
            {
                const t = level.getTile(pos.x, pos.z);
                if (t && t.isVisible) {
                    res = true;
                } else {
                    res = false;
                }
            }
            break;
        case BlockState.STATE_CROUCH_HEIGHT:
            {
                const t = level.getTile(pos.x - 0.5, pos.z);
                const tt = level.getTile(pos.x + 0.5, pos.z);
                if (t && tt && t.isVisible && tt.isVisible) {
                    res = true;
                } else {
                    res = false;
                }
            }
            break;
        case BlockState.STATE_CROUCH_WIDTH:
            {
                const t = level.getTile(pos.x, pos.z - 0.5);
                const tt = level.getTile(pos.x, pos.z + 0.5);
                if (t && tt && t.isVisible && tt.isVisible) {
                    res = true;
                } else {
                    res = false;
                }
            }
            break;
    }

    return res;
}
