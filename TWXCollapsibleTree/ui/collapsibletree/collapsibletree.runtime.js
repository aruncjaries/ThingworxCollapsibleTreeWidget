TW.Runtime.Widgets.collapsibletree = function() {
	var svgContainer;

	// Render the HTML structure for the widget
	this.renderHtml = function() {
		var customClass = this.getProperty("CustomClass") || ""; // Get user-defined class
		return `<div class="widget-content widget-collapsibletree ${customClass}">
	        <svg id="collapsibleTreeSVG"></svg>
	    </div>`;
	};


	// Function called after the widget is rendered in the DOM
	this.afterRender = function() {
		console.log("Initializing afterRender: ", this);
		var self = this;

		// Define values to pass to the afterRender function
		var widgetInstance = this; // Reference to the current widget instance
		var styleDefinition = TW.getStyleFromStyleDefinition(self.getProperty("BaseTreeStyle", "DefaultLabelStyle")); // Get style definition
		var initialExpandCount = self.getProperty('InitialExpandedChildCount') || 0; // Default to 0 if not defined
		var customClass = self.getProperty("CustomClass") || ""; // Get custom class from property

		var widgetContentDiv = widgetInstance.jqElement.find(".widget-content .widget-collapsibletree");
		widgetContentDiv.addClass(customClass); // Add custom class
		console.log("Widget Content Div: ", widgetContentDiv);
		// Apply background color and secondary background color to the widget content div
		widgetInstance.jqElement.css({
			"background-color": styleDefinition.backgroundColor || "#ffffff",
			"background": `linear-gradient(to bottom, ${styleDefinition.backgroundColor || "#ffffff"} 30%, ${styleDefinition.secondaryBackgroundColor || styleDefinition.backgroundColor || "#ffffff"} 100%)`
		});


		// Load D3.js library dynamically
		$.getScript("../Common/extensions/TWXCollapsibleTree/ui/collapsibletree/d3Library/d3.v7.min.js")
			.done(function() {
				console.log("D3.js loaded successfully");

				// Wait for the DOM to be fully ready before rendering the tree
				setTimeout(() => {
					var treeData = self.getProperty('CollapsibleTreeData'); // Get tree data from widget property
					if (treeData) {
						var svgContainer = widgetInstance.jqElement.find("svg"); // Find the SVG container

						if (svgContainer.length > 0) {
							// Calculate the width of the SVG container dynamically
							var width = Math.min(widgetInstance.jqElement[0].getBoundingClientRect().width, 1200);
							width = width - 30;
							// Render the collapsible tree
							renderCollapsibleTree(treeData, svgContainer, initialExpandCount, widgetInstance, styleDefinition, width);
						} else {
							console.error("SVG container not found in widget.");
						}
					} else {
						console.warn("No data found for collapsible tree.");
					}
				}, 100); // Small delay to ensure DOM is ready
			})
			.fail(function() {
				console.error("Failed to load D3.js library.");
			});
	};



	// Initialize or re-render the chart with new data
	this.initializeChart = function(data, expandCount) {
		console.log("Initializing Chart with Data:", data);

		// Ensure data is valid before proceeding
		if (!data) {
			console.error("No data provided to initializeChart!");
			return;
		}

		// Find the SVG element in the widget
		let svgElement = this.jqElement.find("#collapsibleTreeSVG");

		if (!svgElement.length) {
			console.error("SVG Element not found!");
			return;
		}

		// Clear existing SVG content
		svgElement.empty();

		// Recalculate width
		var width = Math.min(this.jqElement[0].getBoundingClientRect().width, 1200);
		width = width - 30;
		console.log("Calculated Width: ", width);

		// Get updated expand count
		var initialExpandCount = expandCount;

		// Get style definition for the tree
		const styleDef = TW.getStyleFromStyleDefinition(this.getProperty("BaseTreeStyle", "DefaultLabelStyle"));

		// Re-render the collapsible tree
		renderCollapsibleTree(data, svgElement, initialExpandCount, this, styleDef, width);
		console.log("Chart successfully re-rendered!");
	};


	// Update widget properties dynamically
	this.updateProperty = function(updatePropertyInfo) {
		var targetProperty = updatePropertyInfo.TargetProperty;
		var newValue = updatePropertyInfo.SinglePropertyValue;

		if (targetProperty === 'CustomClass') {
			this.setProperty("CustomClass", newValue || ""); // Update CustomClass property
			var widgetContentDiv = this.jqElement.find(".widget-content .widget-collapsibletree");
			widgetContentDiv.attr("class", `widget-content widget-collapsibletree ${newValue}`); // Apply new class
		}

		if (targetProperty === 'CollapsibleTreeData') {
			this.setProperty('CollapsibleTreeData', newValue); // Update tree data property
		}

		if (targetProperty === 'InitialExpandedChildCount') {
			this.setProperty('InitialExpandedChildCount', newValue); // Update expand count
		}

		// Fetch the latest values for tree data and expanded child count
		var treeData = this.getProperty("CollapsibleTreeData");
		var expandCount = this.getProperty("InitialExpandedChildCount");

		if (!treeData) {
			console.error("CollapsibleTreeData is undefined or empty. Cannot re-render.");
			return;
		}

		// Re-initialize the chart with updated data and expand count
		this.initializeChart(treeData, expandCount);
	};



	// Getter for LeafNodeClickedValue to be accessed outside the widget
	this.getLeafNodeClickedValue = function() {
		return LeafNodeClickedValue;
	};
	// Getter for LeafNodeClickedValue to be accessed outside the widget
	this.getNodeClickedValue = function() {
		return NodeClickedValue;
	};
};


// Function to render the collapsible tree using D3.js
function renderCollapsibleTree(treeData, svgElement, initialExpandCount, widgetInstance, styleDefinition, width) {
	svgElement.empty(); // Clear the SVG container

	// Define margins and dimensions for the tree
	var margin = { top: 10, right: 10, bottom: 10, left: 40 },
		dx = 20, // Horizontal spacing between nodes
		dy = width / 6; // Vertical spacing between nodes

	// Create a hierarchy from the tree data
	var root = d3.hierarchy(treeData);
	var tree = d3.tree().nodeSize([dx, dy]); // Define the tree layout
	var diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x); // Define the link generator

	// Initialize root node position
	root.x0 = dy / 2;
	root.y0 = 0;

	// Process each node in the hierarchy
	root.descendants().forEach((d) => {
		d.id = d.data.name; // Assign a unique ID to each node
		d._children = d.children; // Store original children

		// Expand nodes based on initialExpandCount
		if (d.depth === 0) {
			d.children = d._children; // Always expand the root node
		} else if (d.depth <= initialExpandCount) {
			d.children = d._children; // Expand nodes up to the specified depth
		} else {
			d.children = null; // Collapse nodes beyond the specified depth
		}
	});

	// Create the SVG container
	var svg = d3.select(svgElement.get(0))
		.attr("viewBox", [-margin.left, -margin.top, width, dx + 100])
		.style("font", "10px sans-serif")
		.style("user-select", "none");

	// Create groups for links and nodes
	var gLink = svg.append("g")
		.attr("fill", "none")
		.attr("stroke", "#555")
		.attr("stroke-opacity", 0.4)
		.attr("stroke-width", 1.5);

	var gNode = svg.append("g")
		.attr("cursor", "pointer")
		.attr("pointer-events", "all");

	// Function to update the tree layout
	function update(event, source) {
		var duration = event?.altKey ? 2500 : 250; // Animation duration
		var nodes = root.descendants().reverse(); // Get all nodes
		var links = root.links(); // Get all links

		tree(root); // Recalculate the tree layout

		// Calculate the bounds of the tree
		let left = root, right = root;
		root.eachBefore(node => {
			if (node.x < left.x) left = node;
			if (node.x > right.x) right = node;
		});

		const height = right.x - left.x + margin.top + margin.bottom;

		// Update the SVG viewBox and height
		svg.transition()
			.duration(duration)
			.attr("height", height)
			.attr("viewBox", [(-margin.left - 30), left.x - margin.top, width, height]);

		// Bind nodes to the DOM
		const node = gNode.selectAll("g").data(nodes, d => d.id);

		const nodeEnter = node.enter().append("g")
			.attr("transform", d => `translate(${source.y0},${source.x0})`)
			.attr("fill-opacity", 0)
			.attr("stroke-opacity", 0)
			.on("click", function(event, d) {
				widgetInstance.setProperty("NodeClickedValue", d.data.value);


				widgetInstance.jqElement.triggerHandler("NodeClicked", {
					name: d.data.name,
					value: d.data.value,
					id: d.id,
					type: d.children || d._children ? "node" : "leaf",  // Correct type
					parent: d.parent ? d.parent.data.name : null
				});

				if (!d.children && !d._children) {
					widgetInstance.setProperty("LeafNodeClickedValue", d.data.value);

					widgetInstance.jqElement.triggerHandler("LeafNodeClicked", {
						name: d.data.name,
						value: d.data.value,
						id: d.id,
						type: "leaf",
						parent: d.parent ? d.parent.data.name : null
					});
				}
				else {
					widgetInstance.setProperty("LeafNodeClickedValue", "");
				}

				if (d.children || d._children) {
					d.children = d.children ? null : d._children;
					update(event, d);
				}
			});


		// Add a circle for each node
		nodeEnter.append("circle")
			.attr("r", 5)
			.attr("class", d => {
				let customClass = widgetInstance.getProperty("CustomClass") || "";
				if (!d._children) {
					return `tree-leaf-node ${customClass}`; // Leaf node
				} else if (d.depth === 0) {
					return `tree-root-node ${customClass}`; // Root node
				} else {
					return `tree-branch-node ${customClass}`; // Other nodes
				}
			})
			.attr("fill", d => {
				let customClass = widgetInstance.getProperty("CustomClass");

				// Only apply default colors if no custom class is defined for the tree-leaf-node
				if (!customClass) {
					return d._children ? "#555" : "#999"; // Default colors
				}
				return null; // Allow ThingWorx CSS to override if defined
			});

		// Add text labels for each node
		const fontSizeMapping = {
			"xsmall": "9px",
			"small": "10px",
			"normal": "11px",
			"large": "12px",
			"xlarge": "14px",
			"xxl": "16px",
			"2xl": "18px",
			"3xl": "22px"
		};
		const fontSizeFetch = styleDefinition.textSize;
		const fontSize = fontSizeMapping[fontSizeFetch] || fontSizeFetch || "12px";
		const fontColor = styleDefinition.foregroundColor || "black";
		const fontWeight = styleDefinition.fontEmphasisBold ? "bold" : "normal";
		const fontStyle = styleDefinition.fontEmphasisItalic ? "italic" : "normal";
		const fontDecoration = styleDefinition.fontEmphasisUnderline ? "underline" : "none";

		nodeEnter.append("text")
			.attr("class", `tree-text ${widgetInstance.getProperty("CustomClass") || ""}`) // Apply custom class
			.attr("dy", "0.31em")
			.attr("x", d => d._children ? -10 : 10)
			.attr("text-anchor", d => d._children ? "end" : "start")
			.text(d => d.data.name)
			.attr("stroke-linejoin", "round")
			.attr("stroke-width", 0.5)
			.attr("stroke", fontColor)
			.style("fill", fontColor)
			.style("font-size", fontSize)
			.style("font-weight", fontWeight)
			.style("font-style", fontStyle)
			.style("text-decoration", fontDecoration)
			.style("font-family", function() {
				const definedFont = window.getComputedStyle(this).getPropertyValue("font-family");
				return definedFont && definedFont !== "none" ? definedFont : "sans-serif"; // Default fallback
			});

		// Update existing nodes
		const nodeUpdate = node.merge(nodeEnter);

		nodeUpdate.transition().duration(duration)
			.attr("transform", d => `translate(${d.y},${d.x})`)
			.attr("fill-opacity", 1)
			.attr("stroke-opacity", 1);

		// Remove exited nodes
		node.exit().transition().duration(duration).remove()
			.attr("transform", d => `translate(${source.y},${source.x})`)
			.attr("fill-opacity", 0)
			.attr("stroke-opacity", 0);

		// Bind links to the DOM
		const lineColor = styleDefinition.lineColor || "#555";
		const strokeDashArray = styleDefinition.lineStyle === "solid" ? "none" :
			styleDefinition.lineStyle === "dashed" ? "5,5" :
				styleDefinition.lineStyle === "dotted" ? "2,2" :
					"none";
		const strokeWidth = styleDefinition.lineThickness || "1.5px";

		var link = gLink.selectAll("path").data(links, d => d.target.id);

		// Enter new links
		var linkEnter = link.enter().append("path")
			.attr("d", d => {
				var o = { x: source.x0, y: source.y0 };
				return diagonal({ source: o, target: o });
			})
			.attr("stroke", lineColor)
			.attr("stroke-dasharray", strokeDashArray)
			.attr("stroke-width", strokeWidth);

		// Update existing links
		link.merge(linkEnter).transition().duration(duration)
			.attr("d", diagonal)
			.attr("stroke", lineColor)
			.attr("stroke-dasharray", strokeDashArray)
			.attr("stroke-width", strokeWidth);

		// Remove exited links
		link.exit().transition().duration(duration)
			.attr("d", d => {
				var o = { x: source.x, y: source.y };
				return diagonal({ source: o, target: o });
			})
			.remove();

		// Store the old positions for transition
		root.eachBefore(d => {
			d.x0 = d.x;
			d.y0 = d.y;
		});
	}

	// Initial render of the tree
	update(null, root);
}