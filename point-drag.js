/*
PointDrag: An intuitive, yet accurate way to position things in 3D.
caislean-west / 1-28-2019
*/

AFRAME.registerComponent('point-drag', {
	schema: {
		debug: { type: 'boolean', default: true },
		type: { type: 'string', default: 'tap' }
	},
	log: function(msg) {
		if (this.data.debug != 0) {
			console.log(msg);
		}
	},
	attachPointer: function(self) {
		var ent = document.createElement('a-entity');
		this.localPos = { x: 0, y: 0, z: -0.2 };
		ent.setAttribute('id', 'point-grab-pointer');
		ent.setAttribute('geometry', "primitive: box;"
																 +"width: 0.3; "
																 +"depth: 0.3; "
																 +"height: 0.3; ");
		ent.setAttribute('material', 'color: #669900; opacity: 1;');
		ent.setAttribute('position', self.localPos);
		ent.setAttribute('rotation', '90 180 0');
		
		this.el.appendChild(ent);

		return ent;
	},	

	init: function() {
		this.localPos = { x: 0, y: 0, z: 0.5 };
		this.scrollScale = 0.1;

		var self = this;

		this.pointerElem = self.attachPointer(self);
		this.ghostElem = null;
		this.ghostSelf = null;

		// Steal the ghost!
		this.el.addEventListener('point-drag-ghost', function(event) {
			self.ghostSelf = event.detail.ghostSelf;
			self.ghostElem = event.detail.ghostEl;
			var ghostEl = self.ghostElem;
			var worldPos = new THREE.Vector3();
			var localPos = new THREE.Vector3();
			worldPos.setFromMatrixPosition(ghostEl.object3D.matrixWorld);
			localPos = self.pointerElem.object3D.worldToLocal(worldPos);
			//ghostEl.parentNode.removeChild(ghostEl);
			self.ghostSelf.removeGhost();
			self.el.emit('under-menu-debug', {msg: "stealing ghost"}, true);
			ghostEl.setAttribute('position', localPos);
			self.pointerElem.appendChild(ghostEl);
			//debuig mesgasdf
			var gm = "stole ghost from: "+worldPos.x+","+worldPos.y+","+worldPos.z; 
			self.el.emit('under-menu-debug', {msg: gm}, true);
			
		});
		// Respond to scroll events
		this.el.addEventListener('trackpad-vscroll', function (event) {
			var vel = -1 * event.detail.vel;
			var z = self.localPos.z;
			self.localPos.z = z + (self.scrollScale * vel);

			self.pointerElem.setAttribute('position', self.localPos);
		});
		// Remove the ghost on doubletap
		this.el.addEventListener('trackpad-doubletap', function (event) {
			if (self.ghostSelf != null) {
				self.pointerElem.removeChild(self.ghostElem);
				self.el.emit('under-menu-debug', {msg: "double-tap reveived?"}, true);
			}
		});
	}
});

AFRAME.registerComponent('point-drag-object', {
	schema: {
		pointerEl: { type: 'selector' },
		debug: { type: 'boolean', default: false }
	},
	log: function(msg) {
		if (this.data.debug != 0) {
			console.log(msg);
		}
	},
	attachGhost: function(self) {
		if (self.ghostEl != null) return self.ghostEl;

		var ghost = self.el.cloneNode(true);
		ghost.removeAttribute("point-drag-object");

		self.ghostEl = ghost;
		self.el.appendChild(ghost);
	},
	removeGhost: function() {
		if (this.ghostEl != null) {
			this.el.removeChild(this.ghostEl);
			this.ghostEl = null;
		}
	},
	init: function() {
		this.pointerEl = this.data.pointerEl;
		this.ghostEl = null;

		// listener funcitons
		this.touchSenseFn = null;
		this.touched = false; 

		var self = this;

		if (this.pointerEl != null) {
			// Respond to laser-pointer/mouse interactions
			self.el.addEventListener('mouseenter', function(event) {
				self.touched = true;
				self.el.emit('under-menu-debug', {msg: "mouseenter?"}, true);
			});
			// testing lasermouse interaction
			this.el.addEventListener('mouseleave', function(event) {
				self.touched = false;
				self.el.emit('under-menu-debug', {msg: "mouseleave?"}, true);
			});

			self.pointerEl.addEventListener('trackpadtouchstart', function() {
				// When laser touches us
				if (self.touched) {
					self.attachGhost(self);
					self.el.emit('under-menu-debug', {msg: "drag-object ghosted itself"}, true);
					self.pointerEl.emit('point-drag-ghost', {ghostEl: self.ghostEl, ghostSelf: self}, true);
				}
			});


			// test moving objects with the dpad!
			/*
			self.attachGhost(self);
			this.pointerEl.addEventListener('trackpad-dpad', function(event) {
				var pos = self.ghostEl.getAttribute('position');
				var n = 1;
				var d = event.detail.dir;

				if (d == 'up') pos.y += n;
				else if (d == 'down') pos.y -= n;
				else if (d == 'right') pos.x += n;
				else if (d == 'left') pos.x -= n;

				self.ghostEl.setAttribute('position', pos);

			});
			/**/
		}
/*
		*/

	}
});
