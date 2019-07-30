"use strict";

var canvas;
var gl;

var numVertices = 36;
var numChecks = 8;

var program;
var c;

var flag = true;
var shadeFlag = true;
var texSize = 64;



// Create a checkerboard pattern using floats

var image1 = new Array()
for (var i = 0; i < texSize; i++)  image1[i] = new Array();
for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
        image1[i][j] = new Float32Array(4);
for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
    image1[i][j] = [c, c, c, 1];
}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
        for (var k = 0; k < 4; k++)
            image2[4 * texSize * i + 4 * j + k] = 255 * image1[i][j][k];



var pointsArray = [];
var colorsArray = [];
var normalsArray = [];
var texCoordsArray = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];


var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 1.0, 1.0),  // white
];

var thetaRLoc;
var shadFlagLoc;


// var lightPosition = vec4(1.0, 1.0, 1.0, 0.0); //first one
// var lightPosition = vec4(0.0, 2.5, 3.0, 0.0); //second
var lightPosition = vec4(3.0, 4.0, -2.0, 0.0);// current
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
// var lightDiffuse = vec4(0.2392, 0.5216, 0.7765, 1.0); 
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 50.0;

var ambientColor, diffuseColor, specularColor;

// **********************************//

var near = 0.1;
var far = 5.0;
var radius = 2;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;

var fovy = 45;  // Field-of-view in Y direction angle (in degrees)
// var aspect;       // Viewport aspect ratio

// var left = -1.0;
// var right = 1.0;
// var ytop = 1.0;
// var bottom = -1.0;

var modelView, projection;
var modelViewMatrix, projectionMatrix;
var normalMatrix, normalMatrixLoc;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var thetaR = [45.0, 45.0, 45.0];
// var thetaR = [0.0, 0.0, 0.0];

var translationMatrix;
var translateX = 0;
var translateY = 0.2;
var translateZ = 0;

var scalingMatrix;
var s = 0.5;


//***************************** *//


function configureTexture(image) {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}


function quad(a, b, c, d) {
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);
    normal = normalize(normal);

    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[0]);
    colorsArray.push(vertexColors[a]);

    pointsArray.push(vertices[b]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[1]);
    colorsArray.push(vertexColors[a]);

    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[2]);
    colorsArray.push(vertexColors[a]);

    pointsArray.push(vertices[a]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[0]);
    colorsArray.push(vertexColors[a]);

    pointsArray.push(vertices[c]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[2]);
    colorsArray.push(vertexColors[a]);

    pointsArray.push(vertices[d]);
    normalsArray.push(normal);
    texCoordsArray.push(texCoord[3]);
    colorsArray.push(vertexColors[a]);

}


function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}


window.onload = function init() {

    canvas = document.getElementById("gl-canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);

    // aspect = canvas.width / canvas.height;

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.SCISSOR_TEST);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    configureTexture(image2);

    thetaRLoc = gl.getUniformLocation(program, "thetaR");
    shadFlagLoc = gl.getUniformLocation(program, "shadeFlag");

    modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    // buttons to change viewing parameters
    document.getElementById("btnIncreaseR").onclick = function () { radius *= 1.4; };
    document.getElementById("btnDecreaseR").onclick = function () { radius *= 0.9; };
    document.getElementById("btnIncreaseTheta").onclick = function () { theta += dr; };
    document.getElementById("btnDecreaseTheta").onclick = function () { theta -= dr; };
    document.getElementById("btnIncreasePhi").onclick = function () { phi += dr; };
    document.getElementById("btnDecreasePhi").onclick = function () { phi -= dr; };
    // document.getElementById("btnShade").onclick = function () { shadeFlag = !shadeFlag; };

    // Sliders to change Scale and translation parameters
    document.getElementById("scale").onchange = function () {
        s = event.srcElement.value;
    };

    document.getElementById("translateX").onchange = function () {
        translateX = event.srcElement.value;
    };
    document.getElementById("translateY").onchange = function () {
        translateY = event.srcElement.value;
    };
    document.getElementById("translateZ").onchange = function () {
        translateZ = event.srcElement.value;
    };

    // Sliders to change planes
    document.getElementById("zFarSlider").onchange = function () {
        far = event.srcElement.value;
    };
    document.getElementById("zNearSlider").onchange = function () {
        near = event.srcElement.value;
    };

    var select = document.getElementById('shadeModel-select')
    select.onchange = function () {
        var d = parseInt(this.options[this.selectedIndex].value);
        console.log(d);
        switch (d) {
            // default:
            // shadeFlag = true; //Gouraud
            case 1:
                shadeFlag = true; //Gouraud
                break
            case 2:
                shadeFlag = false; //Phong
                break
        }
    }


    gl.uniform4fv(gl.getUniformLocation(program,
        "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);


    renderLeft();
    renderRight();
}

// Ortho projection  apperas on the left side of the screen
var renderLeft = function () {

    const width = gl.canvas.width;
    const height = gl.canvas.height;
    const displayWidth = gl.canvas.clientWidth;
    const displayHeight = gl.canvas.clientHeight;
    const dispWidth = displayWidth / 2;
    const dispHeight = displayHeight;
    const aspect = dispWidth / dispHeight;
    const ytop = 1;
    const bottom = -ytop;
    const right = ytop * aspect;
    const left = -right;

    gl.viewport(0, 0, width / 2, height);
    gl.scissor(0, 0, width / 2, height);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(shadFlagLoc, shadeFlag);

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));
    modelView = lookAt(eye, at, up);

    projection = ortho(left, right, bottom, ytop, near, far);

    // Translate
    translationMatrix = translate(translateX, translateY, translateZ);
    modelView = mult(modelView, translationMatrix);

    //Rotate
    thetaR[axis] += 2.0;
    modelView = mult(modelView, rotate(thetaR[xAxis], [1.0, 0.0, 0.0]));
    modelView = mult(modelView, rotate(thetaR[yAxis], [0.0, 1.0, 0.0]));
    modelView = mult(modelView, rotate(thetaR[zAxis], [0.0, 0.0, 1.0]));

    // Scaling
    scalingMatrix = scalem(s, s, s);
    modelView = mult(modelView, scalingMatrix);

    normalMatrix = [
        vec3(modelView[0][0], modelView[0][1], modelView[0][2]),
        vec3(modelView[1][0], modelView[1][1], modelView[1][2]),
        vec3(modelView[2][0], modelView[2][1], modelView[2][2])
    ];


    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(modelView));
    gl.uniformMatrix4fv(projectionMatrix, false, flatten(projection));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    requestAnimFrame(renderRight);
}

// perspective projection apperas on the right side of the screen
var renderRight = function () {

    const width = gl.canvas.width;
    const height = gl.canvas.height;
    const displayWidth = gl.canvas.clientWidth;
    const displayHeight = gl.canvas.clientHeight;
    const dispWidth = displayWidth / 2;
    const dispHeight = displayHeight;
    const aspect = dispWidth / dispHeight;

    gl.viewport(width / 2, 2, width / 2, height);
    gl.scissor(width / 2, 2, width / 2, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(shadFlagLoc, shadeFlag);


    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));

    modelView = lookAt(eye, at, up);
    projection = perspective(fovy, aspect, near, far);

    // Translate
    translationMatrix = translate(translateX, translateY, translateZ);
    modelView = mult(modelView, translationMatrix);

    //Rotate
    thetaR[axis] += 2.0;
    modelView = mult(modelView, rotate(thetaR[xAxis], [1.0, 0.0, 0.0]));
    modelView = mult(modelView, rotate(thetaR[yAxis], [0.0, 1.0, 0.0]));
    modelView = mult(modelView, rotate(thetaR[zAxis], [0.0, 0.0, 1.0]));

    // Scaling
    scalingMatrix = scalem(s, s, s);
    modelView = mult(modelView, scalingMatrix);

    normalMatrix = [
        vec3(modelView[0][0], modelView[0][1], modelView[0][2]),
        vec3(modelView[1][0], modelView[1][1], modelView[1][2]),
        vec3(modelView[2][0], modelView[2][1], modelView[2][2])
    ];


    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(modelView));
    gl.uniformMatrix4fv(projectionMatrix, false, flatten(projection));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numVertices);
    requestAnimFrame(renderLeft);
}
