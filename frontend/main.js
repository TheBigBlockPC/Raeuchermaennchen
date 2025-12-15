const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');

function fetchSync(url) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, false); // `false` makes it synchronous
  xhr.send(null);

  if (xhr.status === 200) {
    return xhr.responseText;
  } else {
    throw new Error(`Request failed with status ${xhr.status}`);
  }
}

const zoom = window.devicePixelRatio;
canvas.width = Math.round(window.innerWidth * zoom);
canvas.height = Math.round(window.innerHeight * zoom);
gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(vsSource, fsSource) {
    const program = gl.createProgram();
    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
    }
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    return program;
}

// Quad mesh definition
const vertices = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
]);
const sparcle_vertices = new Float32Array([
    0,0,
    1,0,
    0.25,0.25,
    0,1,
    -0.25,0.25,
    -1,0,
    -0.25,-0.25,
    0,-1,
    0.25,-0.25,
    1,0,
]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
function loadTexture(url) {
    const tex = gl.createTexture();

    // Bind the texture temporarily to set placeholder data
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Placeholder 1x1 pixel so the texture is valid before the image loads
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([0, 0, 0, 0])
    );

    const image = new Image();
    image.crossOrigin = '';
    image.src = url;
    image.onload = () => {
        // Bind the texture to update it with the loaded image
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null); // unbind after loading
        
    };

    return tex;
}

function define_raeuchermaennchen(type,smoke_spawn){
    let colormap = loadTexture(`/images/${type}/colormap.png`)
    let shading = loadTexture(`/images/${type}/shading_map.png`)
    let base = loadTexture(`/images/${type}/base.png`)
    return {
        colormap: colormap,
        shading: shading,
        base: base,
        smoke_spawn: smoke_spawn
    }
}
const data = {
    smoke_types:{
        Tanne:[0,128,0],
        Weihrauch: [255,255,255],
        Sandelholz: [182,75,43]
    },
    raeuchermaennchen:{
        bergmann:define_raeuchermaennchen("bergmann",[0,0.12]),
        wichtel:define_raeuchermaennchen("wichtel",[-0.15,-0.10])
    }
}

// shader code loading
const vertexShaderSource = fetchSync("./shaders/default_vertex.glsl");
const defaultFragmentShaderSource = fetchSync("./shaders/default_fragment.glsl");
const raeuchermaennchenFragmentShaderSource = fetchSync("./shaders/raeuchermaennchen_fragment.glsl");
const smokeFragmentShaderSource = fetchSync("./shaders/smoke_fragment.glsl");
const smokeVertexShaderSource = fetchSync("./shaders/smoke_vertex.glsl");
const OutlineShaderSource = fetchSync("./shaders/game/outline_fragment.glsl");

// intro
const introVertexShaderSource = fetchSync("./shaders/intro/intro_vertex.glsl");
const introFragmentShaderSource = fetchSync("./shaders/intro/intro_fragment.glsl");

// shader compilation
const default_textured = createProgram(vertexShaderSource, defaultFragmentShaderSource);
const raeuchermaennchen_program = createProgram(vertexShaderSource, raeuchermaennchenFragmentShaderSource);
const smoke_program = createProgram(smokeVertexShaderSource, smokeFragmentShaderSource);
const outline_program = createProgram(vertexShaderSource, OutlineShaderSource);

const intro_program = createProgram(introVertexShaderSource,introFragmentShaderSource);
// load background texture
const background_tex = loadTexture("/images/background.png")

// game icons
const heart = loadTexture("/images/game/heart.png")
const shugercane = loadTexture("/images/game/shugercane.png")
const snowball = loadTexture("/images/game/snowball.png")
const gingerbread = loadTexture("/images/game/gingerbread.png")
const snowman = loadTexture("/images/game/snowman.png")

// initialize smoke texture
const smokeCanvas = document.getElementById('smokeCanvas');
const smoke_texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, smoke_texture);

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, smokeCanvas);

// get all relevant sliders
const skin_color_selector= document.getElementById("skin_color_selector")
const clothing_color_selector= document.getElementById("clothing_color_selector")
const acsessories_color_selector= document.getElementById("acsessories_color_selector")
const smoke_type_selector = document.getElementById("smoke_types")
const smoke_density_selector = document.getElementById("smoke_density")
const raeuchermaennchen_type_selector = document.getElementById("raeuchermaennchen_types")

function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1, 3), 16)/255,
        g: parseInt(hex.slice(3, 5), 16)/255,
        b: parseInt(hex.slice(5, 7), 16)/255
    };
}

// game
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
let is_game = false
let scale = 1

let keys = {};

let tutorial_visible = false
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if(tutorial_visible){
    tutorial_visible = false
    document.getElementById("tutorial").style="display: none";
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

let player_x = 0

function collide_AABB(x1,y1,w1,h1,x2,y2,w2,h2){
    return (
        x1 - w1 < x2 + w2 &&
        x1 + w1 > x2 - w2 &&
        y1 - h1 < y2 + h2 &&
        y1 + h1 > y2 - h2
    )
}

const object_type = {
    COLLECTABLE: 0,
    OBSTACLE: 1,
    COLLECTED: -1
}
class Falling_object{
    constructor (x,y,type,speed,on_collected,texture){
        this.x = x
        this.y = y
        this.speed = speed
        this.type = type
        this.on_collected = on_collected
        this.texture = texture
    }
    update(dt){
        this.y -= dt * this.speed * 0.5
        let hitbox_size = 0.1
        if(this.type == object_type.OBSTACLE){
            hitbox_size = 0.07
        }
        if(collide_AABB(
            this.x,this.y,hitbox_size,hitbox_size,
            player_x,-0.5,0.125,0.25
        )){
            this.type = -1
            this.on_collected()
        }
    }
}

let falling_objects = [
]

let spawn_timer = 0
let score = 0
let highscore = 0
let lives = 3
let gameover = false
const score_displays = Array.from(document.getElementsByClassName("score_information"))
let movement_dir = 0
const show_hitboxes = true
let show_tutorial = false

let invincibility_timer = 0

document.getElementById("play_again").onclick = ()=>{
    player_x = 0;
    score = 0;
    gameover = false;
    movement_dir = 0;
    document.getElementById("gameover").style="display: none";
    lives = 3
}
document.getElementById("play").onclick = ()=>{
    player_x = 0;
    score = 0;
    gameover = false;
    movement_dir = 0;
    document.getElementById("gameover").style="display: none";
    lives = 3;
    is_game = true;
    scale = 0.5;
    
    if(show_tutorial){
        tutorial_visible = true
        show_tutorial = false
        document.getElementById("tutorial").style="";
    }
}
document.getElementById("quit").onclick = ()=>{
    scale = 1;
    player_x = 0;
    scale = 1;
    document.getElementById("gameover").style="display: none";
    is_game = false;
    score_displays.forEach(e => {e.textContent = ""})
}

let intro_timer = 0
let last_time = 0
function render(t) {
    let delta = (t-last_time)/1000
    last_time = t
    if(Number.isNaN(delta)){
        delta = 0
    }
    // generate aspect correction
    let aspect = window.innerWidth / window.innerHeight;
    let x_scale = Math.min(1,1/aspect);
    let y_scale = Math.min(1,aspect);

    // game logic
    if(is_game && !tutorial_visible){
        let speed = 1 + score* 0.01
        if (keys["ArrowLeft"] | keys["KeyA"] && !gameover) {
            movement_dir = -1;
            player_x -= delta * 1.5 * ((speed-1)*0.5+1)
        }
        if (keys["ArrowRight"] | keys["KeyD"] && !gameover) {
            movement_dir = 1;
            player_x += delta * 1.5 * ((speed-1)*0.5+1)
        }
        //player_x += delta * 1.5 * ((speed-1)*0.5+1) * movement_dir
        player_x = Math.max(-1,Math.min(1,player_x))

        spawn_timer += delta * speed
        if (spawn_timer > 1 && !gameover){
            spawn_timer = 0
            let spawn_x = (Math.random() * 2 - 1)
            let is_collectable = Math.random() < 0.5
            if(is_collectable){
                if(Math.random() < 0.2){
                    falling_objects.push(new Falling_object(spawn_x,1,object_type.COLLECTABLE,speed,()=>{
                        score += 2;
                        if(score % 10 <= 1){
                            lives++;
                            lives = Math.min(5,lives);
                        }
                    },gingerbread))
                }else{
                    falling_objects.push(new Falling_object(spawn_x,1,object_type.COLLECTABLE,speed,()=>{
                        score++;
                        if(score % 10 == 0){
                            lives++;
                            lives = Math.min(5,lives);
                        }
                    },shugercane))
                }
            }else{
                if(Math.random() < 0.2){
                    falling_objects.push(new Falling_object(spawn_x,1,object_type.OBSTACLE,speed,()=>{
                        if(invincibility_timer > 0) return;
                        lives-= 2;
                        invincibility_timer = 1
                        if(lives <= 0){
                            document.getElementById("gameover").style=""
                            gameover = true
                            falling_objects = []
                            invincibility_timer = 0
                        }
                    },snowman))
                }else{
                    falling_objects.push(new Falling_object(spawn_x,1,object_type.OBSTACLE,speed,()=>{
                        if(invincibility_timer > 0) return;
                        lives--;
                        invincibility_timer = 1
                        if(lives == 0){
                            document.getElementById("gameover").style=""
                            gameover = true
                            falling_objects = []
                            invincibility_timer = 0
                        }
                    },snowball))
                }
            }
        }
        score_displays.forEach(e => {e.textContent = `Score: ${score} Highscore: ${highscore}`})
        highscore = Math.max(highscore,score)
        falling_objects.forEach(obj => {obj.update(delta)})
        falling_objects = falling_objects.filter(obj => obj.y > -2 && obj.type != object_type.COLLECTED)
        invincibility_timer -= delta
    }
    // data setup
    let raeuchermaennchen_type = raeuchermaennchen_type_selector.value;
    let definition = data.raeuchermaennchen[raeuchermaennchen_type];

    let smoke_spawn_x = definition.smoke_spawn[0] * scale + player_x
    let smoke_spawn_y = definition.smoke_spawn[1] * scale - 0.5
    smoke_spawn_x = smoke_spawn_x / Math.max(1,1/aspect);
    smoke_spawn_y = smoke_spawn_y*y_scale
    window.smoke_spawn = [
        smoke_spawn_x,
        smoke_spawn_y,
    ]
    
    // set textures for rendering
    let base = definition.base;
    let colormap = definition.colormap;
    let shading = definition.shading;

    // set the color matrix
    var skin_color = hexToRgb(skin_color_selector.value);
    var clothing_color = hexToRgb(clothing_color_selector.value);
    var acsessories_color = hexToRgb(acsessories_color_selector.value);
    let color_matrix = new Float32Array([
        skin_color.r, clothing_color.r, acsessories_color.r,
        skin_color.g, clothing_color.g, acsessories_color.g,
        skin_color.b, clothing_color.b, acsessories_color.b,
    ]);
    if(invincibility_timer > 0 && (invincibility_timer%0.25)<0.125){
        color_matrix = new Float32Array([
            1,1,1,
            1,1,1,
            1,1,1
        ])
    }
    // smoke setup
    let smoke_type = smoke_type_selector.value
    let smoke_color = data.smoke_types[smoke_type]
    let smoke_density = parseFloat(smoke_density_selector.value)

    // smoke processing
    window.process_smoke(delta)

    // update smoke texture
    gl.bindTexture(gl.TEXTURE_2D, smoke_texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, smokeCanvas);

    // renderer
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // draw background
    gl.useProgram(default_textured);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, background_tex);
    gl.uniform1i(gl.getUniformLocation(default_textured, 'uTexture'), 0);
    gl.uniform2f(gl.getUniformLocation(default_textured, 'position'), 0,0);
    gl.uniform2f(gl.getUniformLocation(default_textured, 'scale'), 1,1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // draw raeuchermaennchen
    gl.useProgram(raeuchermaennchen_program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colormap);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shading);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, base);
    gl.uniform1i(gl.getUniformLocation(raeuchermaennchen_program, 'uColorTexture'), 0);
    gl.uniform1i(gl.getUniformLocation(raeuchermaennchen_program, 'uShadingTexture'), 1);
    gl.uniform1i(gl.getUniformLocation(raeuchermaennchen_program, 'uBaseTexture'), 2);
    gl.uniform2f(gl.getUniformLocation(raeuchermaennchen_program, 'position'), player_x*x_scale,-0.5*y_scale);
    gl.uniform2f(gl.getUniformLocation(raeuchermaennchen_program, 'scale'), 0.5*scale*x_scale,0.5*scale*y_scale );
    gl.uniformMatrix3fv(gl.getUniformLocation(raeuchermaennchen_program, 'uColorMatrix'), false, color_matrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // draw smoke
    gl.useProgram(smoke_program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, smoke_texture);
    gl.uniform1i(gl.getUniformLocation(smoke_program, 'uTexture'), 0);

    // aspect ratio fix
    let x = window.innerWidth
    let y = window.innerHeight
    let max_dim = Math.max(x,y)
    x = x/max_dim
    y = y/max_dim
    gl.uniform2f(gl.getUniformLocation(smoke_program, 'scale'), 1*1/x,1*1/y);
    gl.uniform4f(gl.getUniformLocation(smoke_program, 'uColor'), smoke_color[0]/255,smoke_color[1]/255,smoke_color[2]/255,smoke_density);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const angle = Math.max(Math.min((t-200)/2000,1),0) * Math.PI * -1;
    const intro_matrix = new Float32Array([
        Math.cos(angle)*0.5,0,Math.sin(angle),-1,
        0,1,0,0,
        -Math.sin(angle)*0.5,0,Math.cos(angle),1,
        0,0,0,1
    ])
    const intro_matrix2 = new Float32Array([
        Math.cos(angle)*-0.5,0,Math.sin(angle),1,
        0,1,0,0,
        -Math.sin(angle)*0.5,0,Math.cos(angle),1,
        0,0,0,1
    ])

    // game
    if(is_game){
        gl.useProgram(default_textured);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(gl.getUniformLocation(default_textured, 'uTexture'), 0);
        falling_objects.forEach(obj => {
            let x = obj.x*x_scale;
            let y = obj.y*y_scale;

            gl.bindTexture(gl.TEXTURE_2D, obj.texture);
            gl.uniform2f(gl.getUniformLocation(default_textured, 'position'), x,y);
            gl.uniform2f(gl.getUniformLocation(default_textured, 'scale'), x_scale*0.1,y_scale*0.1);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        })
        
        gl.bindTexture(gl.TEXTURE_2D, heart);

        let offset = (lives-1)/2 * 0.2
        for(let i = 0;i<lives;i++){
            gl.uniform2f(gl.getUniformLocation(default_textured, 'position'), (player_x+0.2*i-offset)*x_scale,-0.8*y_scale);
            gl.uniform2f(gl.getUniformLocation(default_textured, 'scale'), x_scale*0.1,y_scale*0.1);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        if(show_hitboxes){
            gl.useProgram(outline_program);
            gl.uniform3f(gl.getUniformLocation(outline_program, 'color'), 1,1,1);
            gl.uniform1f(gl.getUniformLocation(outline_program, 'width'), 0.01);
            gl.uniform2f(gl.getUniformLocation(outline_program, 'position'), 0,0);
            gl.uniform2f(gl.getUniformLocation(outline_program, 'scale'), x_scale,y_scale);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            gl.uniform3f(gl.getUniformLocation(outline_program, 'color'), 1,0,1);
            gl.uniform1f(gl.getUniformLocation(outline_program, 'width'), 0.05);
            gl.uniform2f(gl.getUniformLocation(outline_program, 'position'), player_x*x_scale,-0.5*y_scale);
            gl.uniform2f(gl.getUniformLocation(outline_program, 'scale'), x_scale*0.125,y_scale*0.25);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            falling_objects.forEach(obj => {
                let x = obj.x*x_scale;
                let y = obj.y*y_scale;
                gl.uniform3f(gl.getUniformLocation(outline_program, 'color'), 1,1,1);
                if(obj.type == object_type.COLLECTABLE){
                    gl.uniform3f(gl.getUniformLocation(outline_program, 'color'), 1,1,0);
                    gl.uniform2f(gl.getUniformLocation(outline_program, 'scale'), x_scale*0.1,y_scale*0.1);
                }
                if(obj.type == object_type.OBSTACLE){
                    gl.uniform3f(gl.getUniformLocation(outline_program, 'color'), 1,0,0);
                    gl.uniform2f(gl.getUniformLocation(outline_program, 'scale'), x_scale*0.07,y_scale*0.07);
                }
                gl.uniform1f(gl.getUniformLocation(outline_program, 'width'), 0.1);
                gl.uniform2f(gl.getUniformLocation(outline_program, 'position'), x,y);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            })
        }
    }
    //intro
    gl.useProgram(intro_program);
    gl.uniformMatrix4fv(gl.getUniformLocation(intro_program, 'uTransformMatrix'), false, intro_matrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.uniformMatrix4fv(gl.getUniformLocation(intro_program, 'uTransformMatrix'), false, intro_matrix2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    /*
    gl.bufferData(gl.ARRAY_BUFFER, sparcle_vertices, gl.STATIC_DRAW);
    gl.useProgram(default_textured);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, background_tex);
    gl.uniform1i(gl.getUniformLocation(default_textured, 'uTexture'), 0);
    gl.uniform2f(gl.getUniformLocation(default_textured, 'position'), 0,0);
    gl.uniform2f(gl.getUniformLocation(default_textured, 'scale'), 0.5,0.5);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, sparcle_vertices.length);
    */
    requestAnimationFrame(render);
}

render();