import Demon from "./Demon";
import GameObject from "./GameObject";
import Loot from "./Loot";
import { SoundEffect, SoundTrack } from "./SoundSystem";
import { WORLDS } from "./constants";


const STAGES = [...Array(8)].map((_, n) => WORLDS + '/stage' + (n + 1) + '.png');





export default class Stage extends GameObject
{


    // STAGES[level]
    level = 0;

    enemies = 0;
    enemiesPerStageRatio = 5;


    get soundtrack()
    {
        return SoundTrack.cases()[this.level];
    }

    get maxEnemies()
    {
        return this.stage * this.enemiesPerStageRatio;
    }

    get stage()
    {
        return this.level + 1;
    }

    // number of loops n * (deltaX === width)
    loops = 0;

    loopIncreased = false;


    // max loops before clearing stage
    get maxLoops()
    {

        return this.world.loopsToClearStage;
    }


    speed = 10;
    deltaX = 0;


    // GameObject implementation

    x = 0;
    y = 0;

    get width()
    {
        return this.world.width;
    }

    get height()
    {
        return this.world.height;
    }

    #image;

    get decor()
    {

        this.#image ??= new Image();
        const src = STAGES[this.level] ?? STAGES[0];
        if (!this.#image.src.endsWith(src))
        {
            this.#image.src = src;
        }


        return this.#image;
    }




    draw()
    {

        this.generateEnemies();

        const { decor, ctx } = this;

        if (!this.world.hero.isDead)
        {
            this.deltaX += this.speed;
        }

        if (this.deltaX >= this.width)
        {
            this.deltaX = 0;
            this.loops++;
            this.loopIncreased = true;


            if (this.loops >= this.maxLoops)
            {
                SoundEffect.LEVEL.play();
                this.world.pause();
                this.world.trigger('stagecleared');

                alert('stage cleared !!!');

            }


        }


        ctx.drawImage(decor,
            this.deltaX, 0,
            this.width - this.deltaX, this.height,
            0, 0,
            this.width - this.deltaX, this.height
        );

        ctx.drawImage(decor,
            0, 0,
            this.deltaX, this.height,
            this.width - this.deltaX, 0,
            this.deltaX, this.height

        );



    }



    generateEnemy()
    {
        if (this.enemies < this.maxEnemies)
        {
            this.world.objects.push(new Demon(this.world));
            this.world.objects.push(new Loot(this.world));
        }

    }


    generateEnemies()
    {
        if (this.enemies === 0 || this.loopIncreased)
        {
            if (this.loopIncreased)
            {
                this.loopIncreased = false;
            }

            if (this.enemies < this.maxEnemies)
            {

                this.generateEnemy();
                this.enemies++;
            }
        }
    }


    constructor(world)
    {
        super(world);
        world
            .on('started resume', () =>
            {
                SoundTrack.pauseAll();
                this.soundtrack.play();
            })
            .on('paused stagecleared', () =>
            {
                this.soundtrack.pause();
            });
    }
}