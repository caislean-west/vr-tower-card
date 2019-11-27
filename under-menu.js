/*
UnderMenu: Easy to use menu on the underside of the controller
caislean-west / 8-20-2018
*/

AFRAME.registerComponent('under-menu', {
	schema: {
		debug: { type: 'boolean', default: false },
		type: { type: 'string', default: 'tap' }
	},
	applyMenuFading: function(ent, isText=false) {
		var dur = 500;

		var oalpha = document.createElement('a-animation'); 
		if (isText) {
			console.log(ent.getAttribute('text.opacity'));
			oalpha.setAttribute('attribute', 'text.opacity');
			oalpha.setAttribute('from', '0'); 
			oalpha.setAttribute('to', '1'); 
			/*console.log(ent.getAttribute('visible'));
			oalpha.setAttribute('attribute', 'visible');
			oalpha.setAttribute('from', false); 
			oalpha.setAttribute('to', true); */
		} else {
			oalpha.setAttribute('attribute', 'material.opacity');
			oalpha.setAttribute('from', '0'); 
			oalpha.setAttribute('to', '1'); 
		}
		oalpha.setAttribute('dur', dur); 
		oalpha.setAttribute('begin', 'under-menu-open'); 
		ent.appendChild(oalpha);

		var calpha = document.createElement('a-animation'); 
		if (isText) {
			calpha.setAttribute('attribute', 'text.opacity');
			calpha.setAttribute('from', '1'); 
			calpha.setAttribute('to', '0'); 
			/*calpha.setAttribute('attribute', 'visible');
			calpha.setAttribute('from', true); 
			calpha.setAttribute('to', false); */
		} else {
			calpha.setAttribute('attribute', 'material.opacity');
			calpha.setAttribute('from', '1'); 
			calpha.setAttribute('to', '0'); 
		}
		calpha.setAttribute('dur', dur); 
		calpha.setAttribute('begin', 'under-menu-close'); 
		ent.appendChild(calpha);
	},
	attachMenuEntity: function() {
		var ent = document.createElement('a-entity');
		if (this.width == undefined) this.width = 0.1;
		if (this.height == undefined) this.height = 0.16;
		this.localPos = { x: 0, y: 0, z: -0.2 };
		ent.setAttribute('id', 'under-menu');
		ent.setAttribute('geometry', "primitive: plane;"
																 +"width: "+this.width+"; "
																 +"height: "+this.height+"; "); 
		ent.setAttribute('material', 'color: #333333; opacity: 1;');
		ent.setAttribute('position', this.localPos);
		ent.setAttribute('rotation', '90 180 0');
		
		this.el.appendChild(ent);
		this.applyMenuFading(ent);

		return ent;
	},
	attachVisionBox: function() {
		var sideLen = 0.8;
		this.visionRadius = sideLen/2;
		this.visionBox = { x: sideLen, y: sideLen, z: sideLen };
		var vb = this.visionBox;
		var ent = document.createElement('a-box');
		ent.setAttribute('primitive', 'box');
		ent.setAttribute('width', vb.x);
		ent.setAttribute('height', vb.y); 
		ent.setAttribute('depth', vb.z); 
		var pos = Object.assign({},this.localPos);
		pos.y -= (vb.y / 2);
		ent.setAttribute('position', pos);
		ent.setAttribute('material', 'color: blue; opacity: 0.1;');
		ent.setAttribute('visible', false);
		this.el.appendChild(ent);
		return ent;
	},
	checkVisionBox: function() {
		var hpos = new THREE.Vector3();
		hpos.setFromMatrixPosition(this.headElem.object3D.matrixWorld);
		var vpos = new THREE.Vector3();
		vpos.setFromMatrixPosition(this.visionBoxEntity.object3D.matrixWorld);
		var diffLenSq = hpos.sub(vpos).lengthSq();
		var visionSq = this.visionRadius * this.visionRadius;

		if (diffLenSq < visionSq) {
			return true;
		} else {
			return false;
		}
	},

	attachDebugMessage: function() {
		//var ent = document.createElement('a-text');
		var ent = document.createElement('a-entity');
		var m = 0.01;
		var w = this.width-(2*m);
		var h = this.height-(2*m);
		ent.setAttribute('id', 'under-menu-text');
		ent.setAttribute('position', '0 '+(h/2)+' 0.001');
		
		var text = {};
		text['width'] = w;
		text['height'] = h;
		text['align'] = 'left';
		text['anchor'] = 'center';
		text['baseline'] = 'top';
		text['wrapCount'] = '16';

		console.log(text);
		ent.setAttribute('text', text);
		/*
		ent.setAttribute('id', 'under-menu-text');
		ent.setAttribute('position','0 '+(h/2)+' 0.001');
		ent.setAttribute('width', w);
		ent.setAttribute('height', h);
		ent.setAttribute('align', 'left');
		ent.setAttribute('anchor', 'center');
		ent.setAttribute('baseline', 'top');
		ent.setAttribute('wrap-count', '16');
		*/
		if (this.menuEntity) {
			this.menuEntity.appendChild(ent);
		}
		return ent;
	},
	setDebugMessage: function(msg) {
		var list = this.debugList;
		list.shift();
		list.push(msg);
		//this.debugMessage = msg;
		var lmsg = "";
		for(var i=0; i<list.length; i++) {
			lmsg = lmsg+list[i]+"\n";
		}
		this.debugMessage = lmsg;
		this.render();
	},
	setTopMessage: function(msg) {
		this.topMessage = msg;
		this.render();
	},

	// TODO: get rid of self reference, check if necessary?
	openMenu: function(self) {
		if (!self.menuActive) {
			self.menuEntity.emit('under-menu-open', { state: 1 }, true);
			self.menuActive = true;
			if (self.openSound) self.openSound.components.sound.playSound();
			if (self.debugEntity) self.debugEntity.setAttribute('visible', true);
		}
	},
	closeMenu: function(self, silent=false) {
		if (self.menuActive) { 
			self.menuEntity.emit('under-menu-close', { state: 1 }, true);
			self.menuActive = false;
			if (self.closeSound && !silent) self.closeSound.components.sound.playSound();
			if (self.debugEntity) self.debugEntity.setAttribute('visible', false);
		}
	},
	cardinalMove: function(dir) {
		if (dir == 'right') {
			this.setTopMessage("Swipe [>>]");
		} else if (dir == 'left') {
			this.setTopMessage("Swipe [<<]");
		} else if (dir == 'up') {
			this.setTopMessage("Swipe [/\\]");
		} else if (dir == 'down') {
			this.setTopMessage("Swipe [\\/]");
		} 
	},
	render: function() {
		var msg = this.topMessage
							+"\n---\n"
							+this.debugMessage;
		if (this.data.debug == 1) {
			this.debugEntity.setAttribute('text', 'value: '+msg);
		}
	},
	renderList: function () {
	},

	init: function() {
		this.menuActive = false;
		this.menuLevel = 0;

		// Text lines
		this.topMessage = "";
		this.debugMessage = "";
		this.debugList = [];
		for (var i=0; i<10; i++) {this.debugList.push("");}

		// Menu sounds
		this.openSound = this.el.querySelector("#under-menu-open-sound");
		this.closeSound = this.el.querySelector("#under-menu-close-sound");

		// Vision box elements
		this.headElem = document.querySelector("a-entity[camera]");
		this.menuEntity = this.attachMenuEntity();
		this.visionRadius = 1;
		this.visionBoxEntity = this.attachVisionBox();

		if (this.data.debug)
		{
			this.debugEntity = this.attachDebugMessage();
			this.setDebugMessage("The menu has been attached for testing");

			this.dispRot = function(self) {
				var rot = self.el.getAttribute('rotation');
				var rstr = ""+Math.trunc(rot.x)+"\n"+Math.trunc(rot.y)+"\n"+Math.trunc(rot.z)+"\n";
				self.setDebugMessage(rstr);
			};

			//setInterval(this.dispRot, 1000, this);
		}

		this.lookInterval = 100;

		var self = this;

		// Technique for opening menu
		if (this.data.type == 'look') {
			this.lookFn = function (self) {
				var looking = self.checkVisionBox();
				var active = self.menuActive;
				if (looking != active) {
					clearInterval(self.lookFn);
					if (looking)	self.openMenu(self);
					else					self.closeMenu(self);
					self.menuActive = looking;
					setInterval(self.lookFn, self.lookInterval, self);
				} 
			}

			setInterval(this.lookFn, this.lookInterval, this);

		} else {
			this.el.addEventListener('trackpad-tap', function (event) {
				var n = event.detail.count;
				if (self.checkVisionBox()) {
					if (n == 2)
					{
						if (self.menuActive) {
							if (self.menuLevel <= 0) self.closeMenu(self);
						} else {
							self.openMenu(self);
						}
					}
				}
			});
		}

		// Navigate menu
		this.el.addEventListener('trackpad-swipe-cardinal', function (event) {
			var dir = event.detail.dir;

			self.cardinalMove(dir);
		});
		this.el.addEventListener('trackpad-dpad', function (event) {
			var dir = event.detail.dir;

			self.cardinalMove(dir);
		});

		// Response to open/close menu events
		this.el.sceneEl.addEventListener('under-menu-open', function (event) {
			self.setDebugMessage("MENU OPEN");
		});
		this.el.sceneEl.addEventListener('under-menu-close', function (event) {
			self.setDebugMessage("MENU CLOSE");
		});

		// Response to debug message event
		this.el.sceneEl.addEventListener('under-menu-debug', function (event) {
			var msg = event.detail.msg;
			if (msg == null) { msg = "[Insert debug message here.]"; }
			self.setDebugMessage(msg);
		});

		this.el.emit('under-menu-close');
	}
});
