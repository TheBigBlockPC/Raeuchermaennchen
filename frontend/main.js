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
        
        // position update
        this.position_x += this.velocity_x * deltatime*0.5;
        this.position_y += this.velocity_y * deltatime*0.5;
    }
}
class ParticleSystem{
    constructor(){
        this.particles = []
    }
    spawn_particls(x,y){
        let p = new Particle(x,y,0,1)
        this.particles.push(p)
    }
    update(deltatime){
        this.particles.forEach(element => {
            element.update(deltatime)
        });
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
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.narrowest_point = Math.min(this.width,this.height)
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Optional: redraw your content here if needed
        //draw();
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
        
        // smoke_drawing
        this.particle_system.particles.forEach(element => {
            let [x,y] = this.#to_screenspace_position(element.position_x,element.position_y);
            let age = element.age;
            let radius = this.#normalize_radius(0.02+age*0.05);
            let opacity = Math.pow(1-age,2);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle =`rgba(255, 255, 255, ${opacity})`;
            ctx.fill();
        });
        let blur_radius = this.#normalize_radius(0.02)
        ctx.filter = `blur(${blur_radius}px)`; // <-- set blur here
        ctx.drawImage(ctx.canvas, 0, 0); // redraw the canvas contents with blur
    }
}

// initialize
const particle_system = new ParticleSystem()
const renderer = new SmokeRenderer(particle_system)
renderer.resizeCanvas()

// Update canvas size whenever the window is resized
window.addEventListener('resize', ()=>{renderer.resizeCanvas()});

window.addEventListener("mousemove", (e) => {
  cursor_x = e.clientX;
  cursor_y = e.clientY;
});

setInterval(()=>{
    let [x,y] = [0,-0.38]
    particle_system.spawn_particls(x,y)
},10)

let last_time = 0
let cursor_x = 0;
let cursor_y = 0;
function processing_loop(t){
    let delta = (t-last_time)/1000
    last_time = t
    particle_system.update(delta)
    renderer.render(delta)
    
    document.getElementById("data").textContent = `FPS: ${Math.floor(1/delta)}  Particles:${particle_system.particles.length}`;
    
    requestAnimationFrame(processing_loop)
}
requestAnimationFrame(processing_loop)