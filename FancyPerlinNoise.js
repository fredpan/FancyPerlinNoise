// ==========================================================================
// === ===================== The Fancy Perlin Noise ===================== ===
// ==========================================================================
// $Id: FancyPerlinNoise.js,v 1.0 2019/03/27 20:00:00 Liren Pan Created $
// The Fancy Perlin Noise Three.js project
// ==========================================================================
// (C)opyright:
//
//    Liren Pan
//    https://www.fredpan.cn
//	  Available on: https://github.com/fredpan
//	  Published on: https://github.com/fredpan
//
// Creator: Liren Pan
// Email:   fredpan0821@gmail.com
// ==========================================================================
// $Log: PerlinNoise.js,v $
// Revision 0.6   2019/04/01 01:11:27  Liren
// Created controllers for all the existing attributes
//
// Revision 0.6   2019/03/31 23:06:56  Liren
// Speed up!
// Created controllers for the teapot
//
// Revision 0.5.1 2019/03/31 22:07:27  Liren
// Implemented the Perline Fancy Map
//
// Revision 0.5  2019/03/31 20:49:11  Liren
// Implemented the Perline Fancy Map
// 
// Revision 0.3  2019/03/31 01:55:09  Liren
// Implemented the plane using perling noise
// Implemented the perling noise texture
// Improved the control panel
//
// Revision 0.1.1  2019/03/30 15:58:39  Liren
// Applied Perlin noise onto the shape
//
// Revision 0.1  2019/03/30 03:01:27  Liren
// Implemented the way to display normal noise
// Project setup
//
// ========================================================================== 

//Global variables for general settings
var scene;
var camera;
var shape;
var renderer;
var spotLight;
var teapotControllers;
var planeZs;//the array that stores the z coordinate of the plane.

//Global variables for the teapot
var teapotSize = 200;
var teapotSegmentNum = 10;
var selectedTheme = "blood_valley";
var selectedShape = 'plane';

//Global variables for the perlin noise material
var noiseTextureTurbulence = 0.005;
var noiseTextureWidth = 512;
var noiseTextureHeight = 512;

//Global variables for the fancy map (Geometry)
var planeAngle = 110;
var planeWidth = 93;
var planeHeight = 39;
var planeScale = 21;
var planeZCoordinateScale = 100;
var planeZCoordinateTurbulence = 0.06;

//Global variables for the fancy map (Texture)
// map thickness
var peakPercent = 0.9; // (if = 0.9) top 10 % of the highest altitude is the peak
var mountainPercent = 0.5; // (if = 0.5) top 50 % of the highest altitude is the peak
var landPercent = 0.1; // (if = 0.1) top 90 % of the highest altitude is the peak
//var ocean; (if land = 0.1) below 10% is the ocean.

// map colors
var peakColor = '#ffffff';
var mountainColor = '#009900';
var landColor = '#cc9900';
var oceanColor = '#0000ff';



function init(){

	//init basic
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;

	noise.seed(Math.random());

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( canvasWidth, canvasHeight );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x00000 );
	var axesHelper = new THREE.AxesHelper( 5000 );
	scene.add( axesHelper );



	//INIT SKYBOX
	//Init cube textrues
	cubeLoader_blood_valley = new THREE.CubeTextureLoader();
	cubeLoader_blood_valley.setPath( 'img/skybox/blood-valley/' );
	blood_valley = cubeLoader_blood_valley.load( [
	'ft.png', 'bk.png',
	'up.png', 'dn.png',
	'rt.png', 'lf.png'
	] );
	
	cubeLoader_castle = new THREE.CubeTextureLoader();
	cubeLoader_castle.setPath( 'img/skybox/castle/' );
	castle = cubeLoader_castle.load( [
	'ft.png', 'bk.png',
	'up.png', 'dn.png',
	'rt.png', 'lf.png'
	] );

	cubeLoader_city = new THREE.CubeTextureLoader();
	cubeLoader_city.setPath( 'img/skybox/city/' );
	city = cubeLoader_city.load( [
	'ft.png', 'bk.png',
	'up.png', 'dn.png',
	'rt.png', 'lf.png'
	] );

	scene.background = blood_valley;//default theme


	//INIT TEAPOT
	//init colors
	materialColor = new THREE.Color();
	materialColor.setRGB( 1, 1, 1 );
	specularColor = new THREE.Color();
	specularColor.setRGB( 1, 1, 1 );


	//init textures

	generatePerlinTexture();

	//INIT TEAPOT
	teapotGeo = new THREE.TeapotBufferGeometry( teapotSize, teapotSegmentNum, true, true, true, false, true );
	//init textures
	teapotTexture = new THREE.TextureLoader().load( 'img/fern.png' );
	teapotTexture.wrapS = teapotTexture.wrapT = THREE.RepeatWrapping;
	teapotTexture.anisotropy = 21;
	specularMap = new THREE.TextureLoader().load( 'img/fern_specular_map.png' );
	specularMap.wrapS = specularMap.wrapT = THREE.RepeatWrapping;
	specularMap.anisotropy = 21;
	displacementMap = new THREE.TextureLoader().load( 'img/fern_displacement_map.png' );
	displacementMap.wrapS = displacementMap.wrapT = THREE.RepeatWrapping;
	displacementMap.anisotropy = 21;
	displacementMap.roughness = 0;
	bumpMap = new THREE.TextureLoader().load( 'img/fern_bump_map.png' );
	bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
	bumpMap.anisotropy = 21;
	bumpMap.roughness = 0;
	//END OF INIT TEAPOT


	//INIT PERLIN PLANE
	//create geometry for plane when init
	perlinGeo = createPlane();
	worldColorArray = simulateRealWorld();
	worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
	worldTexture.needsUpdate = true;


	//init lights
	ambientLight = new THREE.AmbientLight( 0x333333, 0.1 );
	scene.add(ambientLight);

	directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 0.6 );
	directionalLight.position.set(-1000, 1000, 1000);
	scene.add(directionalLight);

	spotLight = new THREE.SpotLight( 0xffffff, 1 );
	spotLight.position.set( 0, 500, 500 );
	scene.add(spotLight);


	//finish init
	var container = document.getElementById("display");
	container.appendChild( renderer.domElement );


	//attach info
	info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '5px';
    info.style.left = '50px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.style.color = "lightblue";
    info.innerHTML = "<p>The Magic Teapot</p><p>Created by &copy 2019 <a  href='https://github.com/fredpan'>Liren Pan</a></p>";
    container.appendChild(info);

	initGUI();

	initCamera();

	render();

}

function initGUI(){
	generalControllers = new function(){
		this.displaySape = 'plane';

		this.ambientLight = true;
		this.directionalLight = true;
		this.spotLight = true;
		this.spotLightXPosition = 0;
		this.spotLightZPosition = 90;
		this.spotLightLightness = 0.5;
		this.spotLightAngle = 60;
	}

	teapotControllers = new function(){
		this.showFlatShading = false;
		this.showteapotDecal = true;
		this.segmentNum = 10;

		this.showSpecular = false;
		this.shininess = 30;
		this.specularColor = 0xFFFFFF;

		this.showDisplacement = false;
		this.displacementScale = 0;

		this.showBump = false;		
		this.bumpScale = 0;

		this.showCube = false;
		this.envMapping = false;
		this.skyboxTheme = 'blood_valley';

		this.noiseSize = 5;
		this.noiseTextureTurbulence = 0.005;
	}

	planeControllers = new function(){
		this.planeWidth = planeWidth;
		this.planeHeight = planeHeight;
		this.planeScale = planeScale;
		this.planeZCoordinateScale = planeZCoordinateScale;
		this.planeZCoordinateTurbulence = planeZCoordinateTurbulence;
		
		this.peakPercent = 1 - peakPercent;
		this.mountainPercent = 1 - mountainPercent;
		this.landPercent = 1 - landPercent;
		
		this.peakColor = peakColor;
		this.mountainColor = mountainColor;
		this.landColor = landColor;
		this.oceanColor = oceanColor;
	}

	gui = new dat.GUI();

	//shape selection
	gui.add(
		generalControllers, 
		"displaySape", 
		{
			"Utah Teapot" : "teapot", 
			"Plane" : "plane", 
		})
	.name("Select Shape")
	.onChange(
		function(value){
			selectedShape = value;
			if (selectedShape == 'teapot') {
				planeCtrl.domElement.style.display = 'none';
				teapotCtrl.domElement.style.display = '';
				initCamera();
			} else if (selectedShape == 'plane') {
				planeCtrl.domElement.style.display = '';
				teapotCtrl.domElement.style.display = 'none';
				initCamera();
			}
			render();
		});

	//refreshBtn
	// refreshBtn = { add:function(){
	// 	noise.seed(Math.random());
	// 	render();
	// } };
	// gui.add(refreshBtn, "add").name("Refresh");

	//Light teapotControllers
	controllersForLights();

	//Folders to different shapes
	teapotCtrl = gui.addFolder("Teapot Controllers");
	planeCtrl = gui.addFolder("Plane Controllers");

	//Controllers for the teapot
	controllersForTeapot();
	//Controllers for the plane
	controllersForPlane();
	//Controllers for the skybox
	controllersForSkybox();

	//default display the plane so omit the rest
	teapotCtrl.domElement.style.display = 'none';//default
	
}

function initCamera(){
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 80000 );
	if (selectedShape == 'teapot') {
		camera.position.set( - 600, 550, 1300 );
		var cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
		cameraControls.addEventListener( 'change', render );
	} else if (selectedShape == 'plane'){
		camera.position.set( 0, 100, 1000 );
		// TODO to delete below
		var cameraControls = new THREE.OrbitControls( camera, renderer.domElement );
		cameraControls.addEventListener( 'change', render );
	}
	scene.add(camera);
}

function controllersForLights(){
	lightControls = gui.addFolder("Light Controls");
	ambCtrl = lightControls.add(generalControllers, "ambientLight", true, false).name("Ambient Light").onChange(render);
	directCtrl = lightControls.add(generalControllers, "directionalLight", true, false).name("Directional Light").onChange(render);
	spotCtrl = lightControls.add(generalControllers, "spotLight", true, false).name("Spot Light").onChange(render);
	lightControls.add(generalControllers, "spotLightXPosition", -180, 180).name("X Position of Spot Light").onChange(render);
	lightControls.add(generalControllers, "spotLightZPosition", -180, 180).name("Z Position of Spot Light").onChange(render);
	lightControls.add(generalControllers, "spotLightLightness", 0, 1).name("Spot Light Lightness").onChange(render);
	lightControls.add(generalControllers, "spotLightAngle", 0, 180).name("Spot Light Angle").onChange(render);
}

function controllersForTeapot(){
	teapotMaterialControl = teapotCtrl.addFolder("Teapot Materials");
	// teapotMaterialControl.add(teapotControllers, "showPhongShading", true, false).name("Show Phong Shading").onChange(render);
	teapotMaterialControl.add(teapotControllers, "showFlatShading", true, false).name("Show Flat Shading").onChange(render);
	teapotMaterialControl.add(teapotControllers, "showteapotDecal", true, false).name("Show shape Decal").onChange(render);
	teapotMaterialControl.add(teapotControllers, "segmentNum", 1, 210).name("Number of Segment").onChange(function(){
		teapotGeo = new THREE.TeapotBufferGeometry( teapotSize, teapotControllers.segmentNum, true, true, true, false, true );
		render();
	})

	teapotSpecularControl = teapotCtrl.addFolder("Teapot Specular");
	specularCtrl = teapotSpecularControl.add(teapotControllers, "showSpecular", true, false).name("Show Specular").onChange(render);
	teapotSpecularControl.add(teapotControllers, "shininess", 1, 10000).name("Shininess").onChange(render);
	teapotSpecularControl.addColor(teapotControllers, 'specularColor').name('Specular Color').onChange(render);

	teapotDisplacementControl = teapotCtrl.addFolder("Teapot Displacement");
	displacementCtrl = teapotDisplacementControl.add(teapotControllers, "showDisplacement", true, false).name("Show Displacement").onChange(render);
	teapotDisplacementControl.add(teapotControllers, "displacementScale", 0, 30).name("Displacement Scale").onChange(render);

	teapotBumpControl = teapotCtrl.addFolder("Teapot Bump");
	bumpCtrl = teapotBumpControl.add(teapotControllers, "showBump", true, false).name("Show Bump").onChange(render);
	teapotBumpControl.add(teapotControllers, "bumpScale", 0, 1).name("Bump Scale").onChange(render);

	teapotNoiseControl = teapotCtrl.addFolder("Perlin Noise Control");
	teapotNoiseControl.add(teapotControllers, "noiseSize", 3, 11).listen().name("Noise Size").onChange(
		function(value){
			value = Math.round(value);//round up number
			teapotControllers.noiseSize = value;// set the display back first
			value = Math.pow(2, value);// then operate data
			noiseTextureWidth = value;
			noiseTextureHeight = value;
			generatePerlinTexture();
			render();
		});
	teapotNoiseControl.add(teapotControllers, "noiseTextureTurbulence", 0.001, 0.1).name("Noise Turbulence").onChange(
		function(value){
			noiseTextureTurbulence = value;
			generatePerlinTexture();
			render();
		});
}

function controllersForPlane(){

// shape.rotation.x = -50 * Math.PI/180;
	fancyMapGeoControl =planeCtrl.addFolder("Fancy Map Geometry Controls");
	fancyMapGeoControl.add(planeControllers, "planeWidth", 88, 120).listen().name("Map Width").onChange(
		function(value){
			value = Math.round(value);
			if (value%2 != 0) {
				value = value + 1;
			} 
			planeControllers.planeWidth = value; 
			planeWidth = value;
			perlinGeo = createPlane();
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});

	fancyMapGeoControl.add(planeControllers, "planeHeight", 21, 120).listen().name("Map Height").onChange(
		function(value){
			value = Math.round(value);//round up number
			if (value%2 != 0) {
				value = value + 1;
			}// ensure is even
			planeControllers.planeHeight = value;// set the display back first, then operate data
			planeHeight = value;
			perlinGeo = createPlane();
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});

	fancyMapGeoControl.add(planeControllers, "planeScale", 1, 33).listen().name("Map Scale").onChange(
		function(value){
			value = Math.round(value);
			planeControllers.planeScale = value;
			planeScale = value;
			perlinGeo = createPlane();
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});
	fancyMapGeoControl.add(planeControllers, "planeZCoordinateScale", 1, 500).listen().name("Z Axis Scale").onChange(
		function(value){
			// value = Math.round(value);
			planeControllers.planeZCoordinateScale = value;
			planeZCoordinateScale = value;
			perlinGeo = createPlane();
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});
	fancyMapGeoControl.add(planeControllers, "planeZCoordinateTurbulence", 0.001, 0.1).listen().name("Map Turbulence").onChange(
		function(value){
			// value = Math.round(value);
			planeControllers.planeZCoordinateTurbulence = value;
			planeZCoordinateTurbulence = value;
			perlinGeo = createPlane();
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});

	fancyMapGeoControl.add(planeControllers, "peakPercent", 0.05, 0.5).listen().name("Number of peak").onChange(
		function(value){
			planeControllers.peakPercent = value;
			value = 1 - value;
			peakPercent = value;
			// perlinGeo = createPlane();
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});
	fancyMapGeoControl.add(planeControllers, "mountainPercent", 0.3, 0.8).listen().name("Number of mountain").onChange(
		function(value){
			planeControllers.mountainPercent = value;
			value = 1 - value;
			mountainPercent = value;
			// perlinGeo = createPlane();
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});
	fancyMapGeoControl.add(planeControllers, "landPercent", 0.5, 0.95).listen().name("Number of land").onChange(
		function(value){
			planeControllers.landPercent = value;
			value = 1 - value;
			landPercent = value;
			// perlinGeo = createPlane();
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});

	fancyMapGeoControl.addColor(planeControllers, 'peakColor').name('Peak Color').onChange(
		function(value){
			planeControllers.peakColor = value;
			peakColor = value;
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});

	fancyMapGeoControl.addColor(planeControllers, 'mountainColor').name('mountain Color').onChange(
		function(value){
			planeControllers.mountainColor = value;
			mountainColor = value;
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});

	fancyMapGeoControl.addColor(planeControllers, 'landColor').name('Land Color').onChange(
		function(value){
			planeControllers.landColor = value;
			landColor = value;
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});

	fancyMapGeoControl.addColor(planeControllers, 'oceanColor').name('Ocean Color').onChange(
		function(value){
			planeControllers.oceanColor = value;
			oceanColor = value;
			worldColorArray = simulateRealWorld();
			worldTexture = new THREE.DataTexture(worldColorArray, planeWidth, planeHeight, THREE.RGBAFormat);
			worldTexture.needsUpdate = true;
			render();
		});
}

function controllersForSkybox(){
	skybBoxControl = gui.addFolder("Sky Box and IBL");
	skybBoxControl.add(teapotControllers, "showCube", true, false).name("Show Sky Box").onChange(render);
	skybBoxControl.add(teapotControllers, "envMapping", true, false).name("Environment Lighting").onChange(render);
	skybBoxControl
	.add(
		teapotControllers, 
		"skyboxTheme", 
		{
			"Blood Valley" : "blood_valley", 
			"Castle" : "castle", 
			"City" : "city"
		})
	.name("Skybox Theme")
	.onChange(
		function(value){
			selectedTheme = value;
			render();
		});
}


function render() {

	// =========   Skybox Render   =========

	//theme selection
	currTheme = blood_valley;
	if (selectedTheme == "blood_valley") {
		currTheme = blood_valley;``
	}else if (selectedTheme == "castle") {
		currTheme = castle;
	} else if (selectedTheme == "city") {
		currTheme = city
	}else {
		throw new Error('404: Theme not found!');
	}

	if (teapotControllers.showCube) {
		scene.background = currTheme;
		envMap = currTheme;
		if (!teapotControllers.envMapping) {
			envMap = null;
		}
	}else{
		envMap = null;
		scene.background = new THREE.Color( 0x00000 );
	}

	// =========   End of Skybox Render   =========
	

	// =========   Shape Switcher   =========
	//Shape selection
	scene.remove( shape );
	if (selectedShape == 'teapot') {
		phongMaterial = new THREE.MeshPhongMaterial( { color: materialColor, envMap: envMap, side: THREE.DoubleSide} );
		phongMaterial.combine = THREE.MixOperation;
		geo = teapotGeo;
		renderTeapot();
		shape = new THREE.Mesh(geo, phongMaterial);
	} else if (selectedShape == 'plane') {
		phongMaterial = new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
		// phongMaterial = new THREE.MeshPhongMaterial( { color: materialColor, side: THREE.DoubleSide} );
		geo = perlinGeo;
		phongMaterial.map = worldTexture;
		shape = new THREE.Mesh(geo, phongMaterial);
		shape.rotation.x = -39 * Math.PI/180;
	} else{
		throw new Error('404: Shape not found!');
	}

	// =========   End Shape Switcher   =========

//todo
// var wireframe = new THREE.WireframeGeometry( geo );
// shape = new THREE.LineSegments( wireframe );
// shape.material.depthTest = false;
// shape.material.opacity = 0.25;
// shape.material.transparent = true;
	scene.add(shape);

	// =========   Light Render   =========
	//Ambient light trigger
	if (generalControllers.ambientLight){
		scene.remove(ambientLight);
		scene.add(ambientLight);
	}else {
		scene.remove(ambientLight);
	}


	//Directional light trigger
	if (generalControllers.directionalLight){
		scene.remove(directionalLight);
		scene.add(directionalLight);
	}else {
		scene.remove(directionalLight);
	}


	//Spot light trigger
	if (generalControllers.spotLight){
		scene.remove(spotLight);
		spotLight = new THREE.SpotLight( 0xffffff, generalControllers.spotLightLightness );
		spotLight.angle = generalControllers.spotLightAngle * Math.PI/180;
		spotLight.target = shape;
		positionX = generalControllers.spotLightXPosition * Math.PI/180 * 500;
		positionZ = generalControllers.spotLightZPosition * Math.PI/180 * 500;
		spotLight.position.set( positionX, 500, positionZ );
		scene.add(spotLight);
	}else{
		scene.remove(spotLight);
	}
	// =========   End of Light Render   =========

	renderer.render( scene, camera );
}

function renderTeapot(){

	specularColor.set(teapotControllers.specularColor);

	//Shape Decal trigger
	if (teapotControllers.showteapotDecal){
		phongMaterial.map = perlinTexture;
	}else{
		phongMaterial.map = null;
	}

	//Displacement trigger
	if (teapotControllers.showDisplacement){
		phongMaterial.displacementMap = displacementMap;
		phongMaterial.displacementScale = teapotControllers.displacementScale;
	}else{
		phongMaterial.displacementMap = null;
		phongMaterial.displacementScale = 0;
	}


	//Bump trigger
	if (teapotControllers.showBump){
		phongMaterial.bumpMap = bumpMap;
		phongMaterial.bumpScale = teapotControllers.bumpScale;
	}else{
		phongMaterial.bumpMap = null;
		phongMaterial.bumpScale = 0;
	}


	// Specular
	if (teapotControllers.showSpecular){
		phongMaterial.specularMap = specularMap;
		phongMaterial.specular = specularColor;
		phongMaterial.shininess = teapotControllers.shininess;
	}else{
		phongMaterial.specularMap = null;
		phongMaterial.shininess = 0;
	}


	//flat shading
	phongMaterial.flatShading = teapotControllers.showFlatShading;

}

function createPlane(){
	var geometry = new THREE.Geometry();
	planeZs = [];// the generated z coordinate for each vertix. Generated by Perlin Noise

	var yoff = 0;// offset of y
	for (var y = 0; y < planeHeight; y ++) {
		var planeRow = [];
		planeZs[y] = planeRow;
		var xoff = 0;// offset of x
		for (var x = 0; x < planeWidth; x ++) {
			planeZs[y][x] = Math.abs(noise.simplex2(xoff, yoff)) * planeZCoordinateScale;//Math.random(10) * 100;
			xoff += planeZCoordinateTurbulence;
		}
		yoff += planeZCoordinateTurbulence;
	}

	// Start to generate vertices
	var ctr = 0;// counter for vertices
	for (var y = -planeHeight/2; y < planeHeight/2 - 1; y ++) {//Math.abs(noise.simplex2(xoff, yoff))
		for (var x = -planeWidth/2; x < planeWidth/2 - 1; x ++) {
				// x, y, 							zLists[y/planeScale + planeHeight/2]		[x/planeScale + planeWidth/2],			//0
				// x + increment, y, 				zLists[y/planeScale + planeHeight/2]		[x/planeScale + planeWidth/2 + 1],		//1
				// x, y + increment, 				zLists[y/planeScale + planeHeight/2 + 1]	[x/planeScale + planeWidth/2],			//2

				// x, y + increment, 				zLists[y/planeScale + planeHeight/2 + 1]	[x/planeScale + planeWidth/2],			//2
				// x + increment, y + increment, 	zLists[y/planeScale + planeHeight/2 + 1]	[x/planeScale + planeWidth/2 + 1],		//3
				// x + increment, y,  				zLists[y/planeScale + planeHeight/2]		[x/planeScale + planeWidth/2 + 1]		//1
				
				//push vertices
				geometry.vertices.push(new THREE.Vector3(x * planeScale, 				y * planeScale,					planeZs[y * planeScale/planeScale + planeHeight/2][x * planeScale/planeScale + planeWidth/2]));
				geometry.vertices.push(new THREE.Vector3(x * planeScale + planeScale, 	y * planeScale, 				planeZs[y * planeScale/planeScale + planeHeight/2][x * planeScale/planeScale + planeWidth/2 + 1]));
				geometry.vertices.push(new THREE.Vector3(x * planeScale, 				y  * planeScale+ planeScale, 	planeZs[y * planeScale/planeScale + planeHeight/2 + 1][x * planeScale/planeScale + planeWidth/2]));
				geometry.vertices.push(new THREE.Vector3(x * planeScale + planeScale, 	y * planeScale + planeScale, 	planeZs[y * planeScale/planeScale + planeHeight/2 + 1][x * planeScale/planeScale + planeWidth/2 + 1]));
				
				//create faces with normal vector and push them. Each rect requires two faces
				var face1 = new THREE.Face3(ctr, ctr+1, ctr+2, new THREE.Vector3( 0, 1, 0 ));
				geometry.faces.push( face1 );
				var face2 = new THREE.Face3(ctr+2, ctr+3, ctr+1, new THREE.Vector3( 0, 1, 0 ) );
				geometry.faces.push( face2 );
				ctr = ctr + 4;// since each rect requires 4 vertices
		}
	}
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	geometry.computeBoundingBox();

	//UV MAPPING
	var max = geometry.boundingBox.max;
    var min = geometry.boundingBox.min;
	var offset = new THREE.Vector2(0 - min.x, 0 - min.y);// offset ensure the position starts from (0, 0)
	var range = new THREE.Vector2(max.x - min.x, max.y - min.y);// range is used to convert the coordinate into the range of 0 and 1
	var faces = geometry.faces;

	geometry.faceVertexUvs[0] = [];
	// For each face, get its corner coordinate (get the index of the vertix from the face list)
	for (var i = 0; i < faces.length ; i++) {
	    var v1 = geometry.vertices[faces[i].a]; 
        var v2 = geometry.vertices[faces[i].b]; 
        var v3 = geometry.vertices[faces[i].c];

        // Convert those coordinate and put into the UV list
    	geometry.faceVertexUvs[0].push([
    		// For each: use the x or y coordinate plus the offset to ensure the coordinate is >=0; divide by range to conver it to a number between 0 and 1
	        new THREE.Vector2((v1.x + offset.x)/range.x ,(v1.y + offset.y)/range.y),
	        new THREE.Vector2((v2.x + offset.x)/range.x ,(v2.y + offset.y)/range.y),
	        new THREE.Vector2((v3.x + offset.x)/range.x ,(v3.y + offset.y)/range.y)
    	]);
	}
	geometry.uvsNeedUpdate = true;

// bgeometry = new THREE.BufferGeometry().fromGeometry(geometry);
	return geometry;
}

// Function to generate the texture array for the simulated world
function simulateRealWorld(){
	if (planeZs == null || planeZs.length == 0) {
		throw new Error('Empty planeZs list: The simulateRealWorld has been called before init the plane');
	}else{
		//calculate the highest altitude
		var highestAltitude = Number.NEGATIVE_INFINITY;
		for (var i = 0; i < planeZs.length; i ++) {
			for (var j = 0; j < planeZs[i].length; j ++) {
				if (planeZs[i][j] > highestAltitude) {
					highestAltitude = planeZs[i][j];
				}
			}
		}

		//apply the landform condition
		peak = highestAltitude * peakPercent;
		mountain = highestAltitude * mountainPercent;
		land = highestAltitude * landPercent;

		var colorArray = new Uint8Array(4 * noiseTextureWidth * noiseTextureHeight);
		ctr = 0;// counter for the colorArray
		for (var i = 0; i < planeZs.length; i ++) {
			for (var j = 0; j < planeZs[i].length; j ++) {
				var r;
				var g;
				var b;
				if (planeZs[i][j] >= peak) { // peak
					r = getR(peakColor);
					g = getG(peakColor);
					b = getB(peakColor);
				} else if (planeZs[i][j] >= mountain) { // mountain
					r = getR(mountainColor);
					g = getG(mountainColor);
					b = getB(mountainColor);
				} else if (planeZs[i][j] >= land) { // land
					r = getR(landColor);
					g = getG(landColor);
					b = getB(landColor);
				} else { // ocean
					r = getR(oceanColor);
					g = getG(oceanColor);
					b = getB(oceanColor);
				}
				colorArray[ctr] = r;
				colorArray[ctr + 1] = g;
				colorArray[ctr + 2] = b;
				colorArray[ctr + 3] = 255;
				ctr = ctr + 4; // plus 4 because we used the RGBA format
			}
		}
		return colorArray;
	}
}

function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return [(c>>16)&255, (c>>8)&255, c&255].join(',')+',1';
    }
    throw new Error('Bad Hex');
}

function getR(hex){
	var str = hexToRgbA(hex);
	num = str.split(",")[0];
	return parseFloat(num, 10);
}

function getG(hex){
	var str = hexToRgbA(hex);
	num = str.split(",")[1];
	return parseFloat(num, 10);
}

function getB(hex){
	var str = hexToRgbA(hex);
	num = str.split(",")[2];
	return parseFloat(num, 10);
}

function generatePerlinTexture(){
	//INIT PERLIN NOISE MATERIALS
	var textureArray = new Uint8Array(4 * noiseTextureWidth * noiseTextureHeight);
	var yoff = 0;
	for (var y = 0; y < noiseTextureHeight; y ++) {
		var xoff = 0;
		for (var x = 0; x < noiseTextureWidth; x ++) {
		 	var r = Math.abs(noise.simplex2(xoff, yoff)) * (255 + 1);
			var g = Math.abs(noise.simplex2(xoff, yoff)) * (255 + 1);
			var b = Math.abs(noise.simplex2(xoff, yoff)) * (255 + 1);
			var i = ((y * noiseTextureWidth) + x) * 4;
			textureArray[i] = r;
			textureArray[i + 1] = g;
			textureArray[i + 2] = b;
			textureArray[i + 3] = 255;
			xoff += noiseTextureTurbulence;
		}
		yoff += noiseTextureTurbulence;
	}
	perlinTexture = new THREE.DataTexture(textureArray, noiseTextureWidth, noiseTextureHeight, THREE.RGBAFormat);
	perlinTexture.needsUpdate = true;
	perlinTexture.wrapS = perlinTexture.wrapT = THREE.MirroredRepeatWrapping;
	perlinTexture.offset.set( 0, 0 );
	perlinTexture.repeat.set( 2, 2 );
	perlinTexture.anisotropy = 21;
	//END OF INIT PERLIN NOISE MATERIALS
}



















window.addEventListener("load", init, false);