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
        bergmann:define_raeuchermaennchen("bergmann",[0,-0.38]),
        wichtel:define_raeuchermaennchen("wichtel",[-0.15,-0.60])
    }
}

// shader code loading
const vertexShaderSource = fetchSync("./shaders/default_vertex.glsl");
const backgroundFragmentShaderSource = fetchSync("./shaders/default_fragment.glsl");
const raeuchermaennchenFragmentShaderSource = fetchSync("./shaders/raeuchermaennchen_fragment.glsl");
const smokeFragmentShaderSource = fetchSync("./shaders/smoke_fragment.glsl");
const smokeVertexShaderSource = fetchSync("./shaders/smoke_vertex.glsl");

// intro
const introVertexShaderSource = fetchSync("./shaders/intro/intro_vertex.glsl");
const introFragmentShaderSource = fetchSync("./shaders/intro/intro_fragment.glsl");

// shader compilation
const background_program = createProgram(vertexShaderSource, backgroundFragmentShaderSource);
const raeuchermaennchen_program = createProgram(vertexShaderSource, raeuchermaennchenFragmentShaderSource);
const smoke_program = createProgram(smokeVertexShaderSource, smokeFragmentShaderSource);

const intro_program = createProgram(introVertexShaderSource,introFragmentShaderSource);
// load background texture
const background_tex = loadTexture("/images/background.png")

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

let intro_timer = 0
function render(t) {
    
    // data setup
    let raeuchermaennchen_type = raeuchermaennchen_type_selector.value;
    let definition = data.raeuchermaennchen[raeuchermaennchen_type];

    window.smoke_spawn = definition.smoke_spawn;
    
    // set textures for rendering
    let base = definition.base;
    let colormap = definition.colormap;
    let shading = definition.shading;

    // set the color matrix
    var skin_color = hexToRgb(skin_color_selector.value);
    var clothing_color = hexToRgb(clothing_color_selector.value);
    var acsessories_color = hexToRgb(acsessories_color_selector.value);
    const color_matrix = new Float32Array([
        skin_color.r, clothing_color.r, acsessories_color.r,
        skin_color.g, clothing_color.g, acsessories_color.g,
        skin_color.b, clothing_color.b, acsessories_color.b,
    ]);

    // smoke setup
    let smoke_type = smoke_type_selector.value
    let smoke_color = data.smoke_types[smoke_type]
    let smoke_density = parseFloat(smoke_density_selector.value)

    // smoke processing
    window.process_smoke(t)

    // update smoke texture
    gl.bindTexture(gl.TEXTURE_2D, smoke_texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, smokeCanvas);

    // renderer
    let aspect = window.innerWidth / window.innerHeight;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // draw background
    gl.useProgram(background_program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, background_tex);
    gl.uniform1i(gl.getUniformLocation(background_program, 'uTexture'), 0);
    gl.uniform2f(gl.getUniformLocation(background_program, 'position'), 0,0);
    gl.uniform2f(gl.getUniformLocation(background_program, 'scale'), 1,1);
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
    gl.uniform2f(gl.getUniformLocation(raeuchermaennchen_program, 'position'), 0,-0.5);
    gl.uniform2f(gl.getUniformLocation(raeuchermaennchen_program, 'scale'), 0.5/aspect,0.5);
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
    gl.useProgram(intro_program);
    gl.uniformMatrix4fv(gl.getUniformLocation(intro_program, 'uTransformMatrix'), false, intro_matrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.uniformMatrix4fv(gl.getUniformLocation(intro_program, 'uTransformMatrix'), false, intro_matrix2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    /*
    gl.bufferData(gl.ARRAY_BUFFER, sparcle_vertices, gl.STATIC_DRAW);
    gl.useProgram(background_program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, background_tex);
    gl.uniform1i(gl.getUniformLocation(background_program, 'uTexture'), 0);
    gl.uniform2f(gl.getUniformLocation(background_program, 'position'), 0,0);
    gl.uniform2f(gl.getUniformLocation(background_program, 'scale'), 0.5,0.5);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, sparcle_vertices.length);
    */
    requestAnimationFrame(render);
}

render();