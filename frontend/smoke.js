let wind = 0
class Particle{
    constructor (x,y,mx,my){
        this.position_x = x;
        this.position_y = y;
        this.velocity_x = mx;
        this.velocity_y = my;
        this.age = 0;
    }
    update(deltatime){
        // age update
        this.age += deltatime*0.5;

        // velocity update
        let randomFloat = Math.random() * 2 - 1;
        this.velocity_x += randomFloat*deltatime
        this.velocity_x += wind*deltatime

        // position update
        this.position_x += this.velocity_x * deltatime*0.5;
        this.position_y += this.velocity_y * deltatime*0.5;
    }
}
class ParticleSystem{
    constructor(){
        this.particles = []
    }
    spawn_particle(x,y){
        let p = new Particle(x,y,0,1)
        this.particles.push(p)
    }
    update(deltatime){
        // update all particles
        this.particles.forEach(element => {
            element.update(deltatime)
        });

        // delete old particles
        this.particles = this.particles.filter(element => element.age < 1)
    }
}
class SmokeRenderer{
    constructor(particle_system){
        this.canvas = document.getElementById('smokeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.particle_system = particle_system;
        this.time = 0;
    }
    resizeCanvas() {
        // calculate active canvas size
        let width = window.innerWidth;
        let height = window.innerHeight;
        let highest_dimension = Math.max(width,height)
        this.width = Math.floor(width/highest_dimension*512);
        this.height = Math.floor(height/highest_dimension*512);

        this.narrowest_point = this.height;
        this.canvas.width = 512;
        this.canvas.height = 512;
    }
    #normalize_radius(r){
        return this.narrowest_point * r/2
    }
    #to_screenspace_position(x,y){
        return [x * this.narrowest_point/2 + this.width/2, -y * this.narrowest_point/2 + this.height/2]
    }
    to_simulation_position(x,y){
        return [(x-this.width/2)/this.narrowest_point*2,((y-this.height/2)/this.narrowest_point*2)*-1]
    }
    render(t){
        this.time += t;

        // screen clear
        let ctx = this.ctx
        ctx.filter = "none";
        ctx.fillStyle = `rgba(0, 0, 0, ${t*4})`;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // smoke rendering
        this.particle_system.particles.forEach(element => {
            let [x,y] = this.#to_screenspace_position(element.position_x,element.position_y);
            let age = element.age;
            let radius = this.#normalize_radius(0.02+age*0.05);
            let opacity = Math.pow(1-age,2);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle =`rgba(255,255,255, ${opacity})`;
            ctx.fill();
        });

        // screen blur
        let blur_radius = this.#normalize_radius(0.02)
        ctx.filter = `blur(${blur_radius}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
    }
}

// setup
const particle_system = new ParticleSystem()
const renderer = new SmokeRenderer(particle_system)

// initialize canvas size
renderer.resizeCanvas()

window.addEventListener('resize', ()=>{renderer.resizeCanvas()});

// initialize particle system + spawn loop
if(!window.smoke_spawn ){window.smoke_spawn = [0,0]}
setInterval(()=>{
    let [x,y] = window.smoke_spawn;
    particle_system.spawn_particle(x,y)
},10)

// get relevant sliders for wind config
const wind_slider = document.getElementById("wind");
const wind_variation_slider = document.getElementById("wind_variation")

let last_time = 0
window.process_smoke = (t)=>{
    // delat time (keeps everything at the same speed regardless of FPS)
    let delta = (t-last_time)/1000
    last_time = t

    // wind calculation
    let wind_constant = parseFloat(wind_slider.value);
    let wind_variation = parseFloat(wind_variation_slider.value);
    wind = wind_constant + (Math.random() * 2 - 1)*wind_variation;

    // particle update
    particle_system.update(delta)

    // render to smoke canvas
    renderer.render(delta)

    // draw FPS
    document.getElementById("data").textContent = `FPS: ${Math.floor(1/delta)}  Particles:${particle_system.particles.length}`;
}