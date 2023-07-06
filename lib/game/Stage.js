import Demon from "./Demon";
import GameObject from "./GameObject";
import Loot from "./Loot";
import { SoundEffect, SoundTrack } from "./SoundSystem";
import { WORLDS } from "./constants";
import createLoader from "./loader";




const loader = createLoader();

function loadPicture(src)
{
    const elem = new Image();
    loader(elem);
    elem.src = src;
    return elem;
}


const
    STAGES = [...Array(8)].map((_, n) => WORLDS + '/stage' + (n + 1) + '.png'),
    PICTURES = STAGES.map(loadPicture);





export default class Stage extends GameObject
{


    // STAGES[level]

    #level = 0;

    get level()
    {
        return this.#level;
    }

    set level(value)
    {
        this.#level = value;
        this.reset();
        this.world.trigger('levelchange');
    }

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


    get decor()
    {

        return PICTURES[this.level] ?? PICTURES.slice(-1)[0];
    }




    reset()
    {
        this.enemies = this.deltaX = this.loops = 0;
        this.loopIncreased = false;
        this.world.objects.length = 0;
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
            .on('started resume levelchange', () =>
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