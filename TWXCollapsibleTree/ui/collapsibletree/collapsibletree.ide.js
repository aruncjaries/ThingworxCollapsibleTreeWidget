TW.IDE.Widgets.collapsibletree = function() {
	var LeafNodeClickedValue = ""

	this.widgetIconUrl = function() {
		return "../Common/extensions/TWXCollapsibleTree/ui/collapsibletree/CollapsibleTree16.ide.png";
	};

	this.widgetProperties = function() {
		return {
			'name': 'CollapsibleTree',
			'description': 'Basic Collapsible Tree Widget',
			'category': ['Common'],
			'supportsAutoResize': true,
			'properties': {
				'CollapsibleTreeData': {
					'baseType': 'JSON',
					'defaultValue': '',
					'isBindingTarget': true
				},
				'InitialExpandedChildCount': {
					'baseType': 'INTEGER',
					'defaultValue': '2',
					'isBindingTarget': true,
					'isBindingSource': true
				},
				'LeafNodeClickedValue': {
					'baseType': 'STRING',
					'defaultValue': '',
					'isBindingSource': true
				},
				'NodeClickedValue': {
					'baseType': 'STRING',
					'defaultValue': '',
					'isBindingSource': true
				},
				'BaseTreeStyle': {
					'baseType': 'STYLEDEFINITION',
					'defaultValue': 'DefaultLabelStyle',
					'description': '',
					'isBindingTarget': true
				},
				'CustomClass': {
					'baseType': 'STRING',
					'isBindingTarget': true,
					'isBindingSource': true
				}
			}
		}
	};

	// **Register the LeafNodeClicked Event**
	this.widgetEvents = function() {
		return {
			'LeafNodeClicked': {
				'description': 'Triggered when a leaf node is clicked',
				'payload': {
					'baseType': 'JSON',
					'description': 'Data of the clicked leaf node'
				}
			},
			'NodeClicked': {
				'description': 'Triggered when any node (leaf or non-leaf) is clicked',
				'payload': {
					'baseType': 'JSON',
					'description': 'Data of the clicked node'
				}
			}
		};
	};

	// Avoid full re-rendering of HTML
	this.afterSetProperty = function(name, value) {
		if (['CollapsibleTreeData', 'CustomClass', 'InitialExpandedChildCount'].includes(name)) {
			setTimeout(() => this.resize(), 200); // Added delay to prevent excessive calls
		}
		return false; // Ensure it doesn’t trigger a full re-render
	};




	this.renderHtml = function() {
		return `
            <div class="widget-content widget-collapsibletree selectable selected-widget" widget-type="collapsibletree">
                <svg class="collapsibletree-svg" style="width: 100%; height: 100%;">
                    <image class="image-class" href="../Common/extensions/TWXCollapsibleTree/ui/collapsibletree/CollapsibleTree256.ide.png" width="75" height="75"></image>
                    <text class="image-label" text-anchor="middle" font-size="14" fill="black" dominant-baseline="middle">
                       Bind data to the Collapsible tree.
                    </text>
                </svg>
            </div>`;
	};

	this.resize = function() {
		let svg = document.querySelector(".collapsibletree-svg");

		if (svg) {
			// Get the width and height using getBoundingClientRect
			let dimensions = svg.getBoundingClientRect();
			let width = dimensions.width;
			let height = dimensions.height;

			// Log the width and height for debugging
			//console.log("Widget dimensions (width, height):", { width, height });

			// Check if width and height are valid
			if (isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
				console.error("Invalid width or height:", width, height);
				return; // Exit if dimensions are invalid
			}

			let img = svg.querySelector("image");
			let text = svg.querySelector(".image-label");

			if (img && text) {
				let imgWidth = 75;  // Image width is 75 units
				let imgHeight = 75; // Image height is 75 units

				// Update the SVG size to match widget dimensions
				svg.setAttribute("width", width);
				svg.setAttribute("height", height);

				// Dynamically set the viewBox to ensure content scales correctly
				svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

				// Horizontally and vertically center the image within the SVG
				let imgX = (width - imgWidth) / 2; // Center horizontally
				let imgY = (height - imgHeight) / 3; // Center vertically

				// Log the calculated position for debugging
				//console.log("Calculated image position:", { imgX, imgY });

				// Set the image's position inside the SVG
				img.setAttribute("x", imgX);
				img.setAttribute("y", imgY);

				// Ensure image's width and height are correct
				img.setAttribute("width", imgWidth);
				img.setAttribute("height", imgHeight);

				// Center the label horizontally below the image
				text.setAttribute("x", (width / 2) + 10);  // Center the text horizontally and shift it slightly to the right
				text.setAttribute("y", imgY + imgHeight + 15); // Place text below the image
				text.setAttribute("dominant-baseline", "middle"); // Adjust vertical alignment for the label
				text.setAttribute("text-anchor", "middle"); // Center the text horizontally
				text.style.fontWeight = "bold";

			}
		}
	};

	this.afterRender = function() {
		var self = this;

		setTimeout(function() {
			self.resize();
		}, 100);

		// Remove any existing observer
		if (self.observerInstance) {
			self.observerInstance.disconnect();
		}

		let debounceResize;
		function handleResize() {
			clearTimeout(debounceResize);
			debounceResize = setTimeout(() => {
				self.resize();
			}, 200);
		}

		// Create a new observer
		self.observerInstance = new MutationObserver(function(mutations) {
			let shouldResize = false;

			mutations.forEach(function(mutation) {
				if (mutation.type === "childList" || mutation.type === "attributes") {
					shouldResize = true;
				}
			});

			if (shouldResize) {
				handleResize();
			}
		});

		var targetNode = document.querySelector(".widget-collapsibletree");
		if (targetNode) {
			self.observerInstance.observe(targetNode, { attributes: true, childList: true, subtree: false });
		}
	};



};
