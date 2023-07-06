import { BackedEnum } from "../../modules/utils/utils.mjs";
import GameObject from "./GameObject";
import Loot from "./Loot";
import { SoundEffect } from "./SoundSystem";
import { HERO } from "./constants";
import createLoader from "./loader";



const imageLoader = createLoader();


export function animate(sprites, loop = true)
{
    let
        index = 0,
        counter = 0;


    const images = sprites.map(src =>
    {
        const img = new Image();
        imageLoader(img);
        img.src = src;
        return img;
    });


    return () =>
    {

        // ends animation with a false
        let flag = true;

        counter++;

        if ((counter % 4) === 0)
        {
            index++;
        }


        if (index >= images.length)
        {
            index = 0;
            flag = loop;
        }


        return flag && images[index];
    };

}




const STATES = new Map([
    [
        'moving', [
            // sprites
            [...Array(9)].map((_, n) => HERO + '/moving/' + (n + 1) + '.png'),

            //can loop
            true
        ]

    ],
    [
        'attacking', [
            [...Array(6)].map((_, n) => HERO + '/attacking/' + (n + 1) + '.png'),
            // cannot loop
            false
        ]
    ],

    [
        'dead', [
            [...Array(10)].map((_, n) => HERO + '/dead/' + (n + 1) + '.png'),
            // cannot loop
            false
        ]
    ],
]);



export class HiroStates extends BackedEnum
{
    static MOVING = new HiroStates('moving');
    static ATTACKING = new HiroStates('attacking');
    static DEAD = new HiroStates('dead');


    get sprites()
    {
        return STATES.get(this.value)[0];
    }

    #animation;

    getAnimation()
    {
        return this.#animation ??= animate(...STATES.get(this.value));
    }
}




export default class Hiro extends GameObject
{

    maxHP = 6;
    hp = 6; //à définir 

    killCount = 0;

    // box
    x = 100;
    y = 350;
    width = 150;
    height = 150;

    // jump limits
    minY = 150;
    maxY = 350;

    // jump strength (in px)
    gravity = 1;
    jumpStep = 15;
    deltaY = 0;

    // state jumping
    isJumping = false;

    // state attacking
    isAttacking = false;


    //state dead
    isDead = false;

    // points to the character state
    state = HiroStates.MOVING;


    // points to the current sprite (false sets state to moving)
    currentSprite = false;

    // hero can intercepts object one time
    intercepting = [];



    draw()
    {
        const { ctx } = this;


        if (this.isJumping)
        {
            this.jump();
        }

        if (this.isAttacking)
        {
            this.attack();
        }

        // no else as attacking state can be changed
        if (!this.isAttacking)
        {
            this.move();
        }

        // checks intersections
        this.intersections();

        if (this.isDead)
        {
            this.dead();
        }



        ctx.drawImage(this.currentSprite,
            this.x, this.y,
            this.width, this.height
        );
    }


    dead()
    {

        if (!this.isDead)
        {
            return;
        }
        this.state = HiroStates.DEAD;
        if (false === (this.currentSprite = this.state.getAnimation(this)()))
        {
            this.world.pause();

            this.world.trigger('dead', { item: this });
        }



    }



    move()
    {
        this.state = HiroStates.MOVING;
        this.currentSprite = this.state.getAnimation(this)();
    }

    attack()
    {

        if (this.isAttacking)
        {

            this.state = HiroStates.ATTACKING;
            if (false === (this.currentSprite = this.state.getAnimation(this)()))
            {
                this.isAttacking = false;
            }

        }

        // no else as it can be unset
        if (!this.isAttacking)
        {
            this.state = HiroStates.MOVING;
            this.move();
        }

    }



    jump()
    {

        if (!this.isJumping)
        {
            return;
        }
        // jumping up
        if (this.deltaY === 0)
        {
            this.deltaY = - (this.jumpStep * this.gravity);
        }
        // jump up => down
        else if (this.y <= this.minY)
        {
            this.deltaY = -1 * this.deltaY;
            this.y = this.minY;

        }
        // jumping down
        else if (this.y >= this.maxY)
        {
            this.deltaY = 0;
            this.isJumping = false;
            this.y = this.maxY;
            return;
        }

        this.y += this.deltaY;
    }



    intersections()
    {


        // clears unique intercepts
        this.intercepting = this.intercepting.filter(item =>
        {


            if (item.destroyed || !item.isIntersecting(this))
            {
                return false;
            }

            return true;
        });


        // copying as it can be destroyed
        for (let item of [...this.world.objects])
        {


            if (item.isIntersecting(this) && !this.intercepting.includes(item))
            {

                if (item.scoreGain > 0)
                {

                    this.intercepting.push(item);

                    if (!item.isEnemy || this.isAttacking)
                    {
                        this.world.score += item.scoreGain;

                        this.world.destroyObject(item);
                        if (item instanceof Loot)
                        {
                            SoundEffect.DROP.play();
                        }

                        // generate a new enemy
                        if (item.isEnemy)
                        {
                            this.killCount++;
                            this.world.stage.generateEnemy();
                        }


                        // do something to the item (animation and destroy)
                        this.world.trigger('scoregain', { item });


                    }
                    // lose hp
                    else if (item.isEnemy)
                    {

                        this.hp--;
                        this.world.trigger('hploss', { item });
                        if (this.hp <= 0)
                        {
                            // this.world.pause();
                            // alert('You are dead !!!');
                            // this.world.trigger('dead', { item: this });
                            SoundEffect.DEATH.play();

                            this.isDead = true;
                        } else
                        {
                            SoundEffect.HIT.play();
                        }

                    }
                }


            }



        }



    }



}