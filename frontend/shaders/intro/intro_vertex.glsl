attribute vec2 aPosition;
varying vec2 vUv;
uniform mat4 uTransformMatrix;
void main() {
    vUv = (aPosition * 0.5 + 0.5) *vec2(1.0,-1.0)+vec2(0.0,1.0);
    vec4 vertex_pos = vec4(aPosition.xy,0,1) + vec4(1,0,0,0);
    vertex_pos = vertex_pos * uTransformMatrix;
    gl_Position = vec4(vertex_pos.xyz, vertex_pos.z);
}