if (typeof window.tbl2csv === 'undefined') {
window.tbl2csv = function() {
// export type (text,html)
let mode = "text";

// add empty data link
let link = document.createElement('a');
link.style.display = 'none';
link.setAttribute('target', '_blank');
link.setAttribute('download', 'data.csv');
document.body.append(link);

// consts
const re_quote = new RegExp('"','gm');
const re_break = new RegExp('(\r\n|\n|\r)','gm');
const re_space = new RegExp('(\s\s)','gm');
const tblrowdsps = ['table-row', 'table-header-group', 'table-footer-group' ];
const convert = {
	  'DIV': div2csv,
	'TABLE': table2csv,
	   'UL': list2csv, 
	   'OL': list2csv
};

function getDataFromNode(node) {
	let data = (mode.endsWith('html')) ? node.innerHTML : node.innerText;
	return data.trim().replace(re_break,'').replace(re_space,' ').replace(re_quote,'""');
}

function div2csv(tbl){
	let csv = [];
	tbl.querySelectorAll('div').forEach( (tr) => {
		if( tblrowdsps.includes(getStyle(tr,'display')) ) {
			let row = [];
			tr.querySelectorAll('div').forEach( (td) => {
				if( getStyle(td,'display') === 'table-cell' ) {
					const data = getDataFromNode(td);
					row.push('"' + data + '"');
				}
			});
			if(row.length > 0) {
				csv.push(row.join(';'));
			}
		}
	});
	return csv.join('\n');
}

function table2csv(tbl) {
	let csv = [];
	tbl.querySelectorAll('tr').forEach( (tr) => {
		// skip rows in subtables
		if( ! tbl.isSameNode(tr.closest('table'))){
			return;
		}
		let row = [];
		tr.querySelectorAll('td, th').forEach( (td) => {
			const data = getDataFromNode(td);
			row.push('"' + data + '"');
			// add colspan padding
			for(var i=1, n=td.getAttribute("colspan"); i < n; row.push('""'), i++);
		});
		// skip rows without cells
		if(row.length > 0) {
			csv.push(row.join(';'));
		}
	});
	return csv.join('\n');
}

function list2csv(ul) {
	let csv = [];
	ul.querySelectorAll('li').forEach( (li) => {
		const data = getDataFromNode(li);
		csv.push('"' + data + '"');
	});
	return csv.join('\n');
}

function getClosestExportableParent(node){
	while(	
		node !== null 
		&& node.tagName !== 'TABLE'
		&& node.tagName !== 'OL'
		&& node.tagName !== 'UL'
	     ) {
		if( node.tagName === 'DIV' && getStyle(node,'display') === 'table' ){
			break;
		}
		node = node.parentNode;
	}
	return node;
}

function simulateClick(elem) {
	const evt = new MouseEvent('click', {
		bubbles: false,
		cancelable: false,
		view: window
	});
	elem.dispatchEvent(evt);
}


function highlightDivTables(){
	document.querySelectorAll('div').forEach( (div) => {
		if (getStyle(div,'display') === 'table') {
			if(!hasClass(div,'divTbl') ) {
				addClass(div,'divTbl');
			}
		}
	});
}

function getStyle(node, attr){
	return window.getComputedStyle(node,null)[attr];
}

function hasClass(ele,cls) {
  return !!ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

function addClass(ele,cls) {
	ele.className += " "+cls;
}

function delClass(ele,cls) {
    var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
    ele.className=ele.className.replace(reg,' ');
}

const highlightCSS = `
.divTbl, ol, ul, table { 
	border: 3px dotted red !important; 
	padding:1px !important; 
	margin:1px !important; 
}`;

let hlon = false;

// register message listener 
browser.runtime.onMessage.addListener( (message) => {
	if(message.hlDivTbls) {
		highlightDivTables();
		var sheet = window.document.styleSheets[0];
		if(message.hlToggle) {
			sheet.insertRule(highlightCSS, 0);
		}else{
			sheet.deleteRule(0);
		}
		return;
	}
	

	mode = message.mode;
	const clickTarget = browser.menus.getTargetElement(message.targetElementId);
	const exportableTarget = getClosestExportableParent(clickTarget);
	if(exportableTarget === null){
		alert('No exportable target found!\nHint: Click the toolbar icon to highlight exportable targets');
		return;
	}
	const str = convert[exportableTarget.tagName](exportableTarget);
	link.setAttribute('href','data:text/csv;charset=utf-8,'+encodeURIComponent(str));
	simulateClick(link);
});
}
tbl2csv();
}
