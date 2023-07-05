import { getClass } from "../../modules/utils/utils.mjs";
import GameWorld from "./GameWorld";


export class Box
{


    static of(gameobj)
    {
        return new Box(gameobj);
    }


    min = {
        x: 0,
        y: 0,
    };

    max = {
        x: 0,
        y: 0,
    };


    constructor({ x, y, width, height })
    {
        this.min.x = x;
        this.max.x = x + width;
        this.min.y = y;
        this.max.y = y + height;
    }

    /**
     * @link https://github.com/mrdoob/three.js/blob/dev/src/math/Box2.js
     */
    intersects(box)
    {
        if (box instanceof Box === false)
        {
            return false;
        }

        return box.max.x < this.min.x || box.min.x > this.max.x ||
            box.max.y < this.min.y || box.min.y > this.max.y ? false : true;

    }
}



export default class GameObject
{


    world;

    /**
     * @abstract
     */
    get x()
    {

        throw new Error(getClass(this) + '.x not implemented');

    }

    /**
     * @abstract
     */
    get y()
    {
        throw new Error(getClass(this) + '.y not implemented');

    }

    /**
     * @abstract
     */

    get width()
    {
        throw new Error(getClass(this) + '.width not implemented');

    }
    /**
     * @abstract
     */
    get height()
    {
        throw new Error(getClass(this) + '.height not implemented');

    }

    isEnemy = false;
    // gain score when intersecting non ennemy object || intersecting ennemy + attacking
    scoreGain = 0;


    get name()
    {
        return getClass(this);
    }

    get ctx()
    {
        return this.world.ctx;
    }

    #box;
    get box()
    {
        return this.#box ??= Box.of(this);

    }


    isIntersecting(obj)
    {
        if (obj instanceof GameObject === false)
        {
            return false;
        }

        return this.box.intersects(obj.box);
    }


    /**
     * @abstract
     */
    draw()
    {
        throw new Error(getClass(this) + '.draw() is not implemented');
    }



    constructor(world)
    {
        if (world instanceof GameWorld === false)
        {
            throw new TypeError('Invalid world !!!');
        }

        this.world = world;
    }







}