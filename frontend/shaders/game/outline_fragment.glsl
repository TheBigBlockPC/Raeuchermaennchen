precision mediump float;
varying vec2 vUv;
uniform float width;
uniform vec3 color;
void main() {
    vec2 uv = abs((vUv-0.5)*2.0);
    float v = max(uv.x,uv.y);
    if(v > 1.0-width){
        v = 1.0;
    }else{
        v = 0.0;
    }
    gl_FragColor = v*vec4(color,1.0);
}