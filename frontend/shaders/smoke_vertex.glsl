attribute vec2 aPosition;
varying vec2 vUv;
uniform vec2 scale;
void main() {
    vUv = (aPosition * 0.5 + 0.5) *vec2(1.0,-1.0)+vec2(0.0,1.0);
    gl_Position = vec4((aPosition+vec2(1.0,-1.0))*scale+vec2(-1.0,1.0), 0.0, 1.0);
}