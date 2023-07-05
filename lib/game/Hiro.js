import { BackedEnum, isInt } from "../../modules/utils/utils.mjs";
import { HERO } from "./constants";
import createLoader from "./loader";


const ANIMATIONS = {
    left: [...Array(9)].map((_, n) =>
        HERO + '/left/' + (n + 1) + '.png'
    ),
    right: [...Array(9)].map((_, n) =>
        HERO + '/right/' + (n + 1) + '.png'
    ),
};


const imageLoader = createLoader(() => console.debug('all loaded'));


function animate(sprites)
{
    let index = 0, counter = 0;
    const images = sprites.map(src =>
    {
        const img = new Image();
        imageLoader(img);
        img.src = src;
        return img;
    });


    return () =>
    {

        counter++;

        if ((counter % 4) === 0)
        {
            index++;
        }

        if (index >= images.length)
        {
            index = 0;
        }
        return images[index] ?? images[0];
    };

}



const
    animationLeft = animate(ANIMATIONS.left),
    animationRight = animate(ANIMATIONS.right);


export class Direction extends BackedEnum
{
    static LEFT = new Direction('left');
    static RIGHT = new Direction('right');



    get method()
    {
        return this.value === 'left' ? animationLeft : animationRight;
    }
}




export default class Hiro
{

    element;
    hp = 3; //à définir 
    jumpHeight = 200; //basée sur des pixels
    gravity = 1; //Attraper des modificateurs ?
    jumpEventActive = true; // Désactiver la fonction de saut si le personnage est déjà en l'air => false
    x = 100;
    y = 350;

    minY = 150;
    maxY = 350;
    isJumping = false;
    deltaY = 0;

    direction = Direction.RIGHT;

    constructor(world)
    {


        this.world = world;
        addEventListener('keyup', ({ key }) =>
        {

            console.debug(key);

            if (/\s+/.test(key) && !this.isJumping)
            {
                this.isJumping = true;
            }

            if (key === 'ArrowLeft')
            {
                this.direction = Direction.LEFT;
            }

            if (key === 'ArrowRight')
            {
                this.direction = Direction.RIGHT;
            }

        });

    }


    draw()
    {
        const { ctx } = this.world;
        if (this.isJumping)
        {
            this.jump();
        }

        ctx.drawImage(this.direction.method(),
            this.x, this.y,
            150, 150
        );
    }


    jump()
    {

        if (!this.isJumping) { return; }
        if (this.deltaY === 0)
        {
            this.deltaY = -15;
        } else if (this.y <= this.minY)
        {
            this.deltaY = -1 * this.deltaY;
        } else if (this.y >= this.maxY)
        {
            this.deltaY = 0;
            this.isJumping = false;
        }

        this.y += this.deltaY;




    }





}