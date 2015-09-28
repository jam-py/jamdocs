(function(window, undefined) {
"use strict";
var $ = window.$;

function TaskEvents() {}

window.task_events = new TaskEvents();

function Events1() { // jamdoc 

	function view_projects(task) {
		task.parameters.view();
	}
	
	function on_page_loaded(task) {
		var height,
			groups;
	
		task.parameters.open();	
		if (task.parameters.locate('is_active', true)) {
			if (task.server('valid_project_path', [task.parameters.doc_path.value])) {
				task.project_path = task.parameters.doc_path.value;
			}
		}
		if (!task.project_path) {
			view_projects(task);
			return;
		}
		
		$('#content').empty();
		task.server('init_project', [task.parameters.id.value]);
		task.project_path = task.parameters.doc_path.value;
		task.project_name = task.parameters.project_name.value;
		
		task.os_sep = task.parameters.os_sep.value;
		task.source_suffix = task.parameters.source_suffix.value;
	
		$("#project-name").text(task.project_name + ': ');
		$("#project-path").html(task.project_path).off('click');
		$("#project-path").html(task.project_path).on('click', function(e) {
			e.preventDefault();
			view_projects(task);
		});
		
		task.topics.view($("#content"));
		
		$(window).on('resize', function() {
			resize(task);
		});
		$(window).blur(function(){
			task.window_focused = false;
		});
		$(window).focus(function(){
			task.window_focused = true;
			task.server('check_files');
		});	
		setInterval(function() {
				check_files(task);
			}, 5 * 1000
		);
	} 
	
	function check_files(task) {
		if (task.window_focused) {
			task.server('check_files');
		}
	}
	
	function create_print_btns(item) {
		var $ul,
			$li,
			reports = [];
		if (item.reports) {
			for (var i = 0; i < item.reports.length; i++) {
				if (item.reports[i].can_view()) {
					reports.push(item.reports[i]);
				}
			}
			if (reports.length) {
				$ul = item.view_form.find("#report-btn ul");
				for (var i = 0; i < reports.length; i++) {
					$li = $('<li><a href="#">' + reports[i].item_caption + '</a></li>');
					$li.find('a').data('report', reports[i]);
					$li.on('click', 'a', function(e) {
						e.preventDefault();
						$(this).data('report').print_report(false);
					});
					$ul.append($li);
				}
			}
			else {
				item.view_form.find("#report-btn").hide();
			}
		}
		else {
			item.view_form.find("#report-btn").hide();
		}
	}
	
	function on_before_show_view_form(item) {
		var expand_selected_row,
			table_options = {
				height: 480,
				word_wrap: false,
				sortable: true
			};
		if (item.view_form.hasClass('modal')) {
			item.view_options.width = 960;
		}
		else {
			item.view_form.find(".modal-body").css('padding', 0);
			item.view_form.find(".view-title #title-left").append($('<h4>' + item.item_caption + '<h4>'));
			table_options.height = $(window).height() - $('body').height() - 40;
		}
		if (item.can_create()) {
			item.view_form.find("#new-btn").on('click.task', function() {item.insert_record();});
		}
		else {
			item.view_form.find("#new-btn").attr('disabled','disabled');
		}
		if (item.can_edit()) {
			item.view_form.find("#edit-btn").on('click.task', function() {item.edit_record();});
		}
		else {
			item.view_form.find("#edit-btn").attr('disabled','disabled');
		}
		if (item.can_delete()) {
			item.view_form.find("#delete-btn").on('click.task', function() {item.delete_record();});
		}
		else {
			item.view_form.find("#delete-btn").attr('disabled','disabled');
		}
		
		create_print_btns(item);
	
		if (item.init_table) {
			item.init_table(item, table_options);
		}
		item.view_table = item.create_table(item.view_form.find(".view-table"), table_options);
	}
	
	function on_after_show_view_form(item) {
		expand_buttons(item.view_form);
		if (item.item_name !== 'topics') {
			item.open();
		}
	}
	
	function on_before_show_edit_form(item) {
		var input_options = {
				col_count: 1
			};
		item.edit_options.width = 560;
		if (item.init_inputs) {
			item.init_inputs(item, input_options);
		}
		item.create_inputs(item.edit_form.find(".edit-body"), input_options);
		item.edit_form.find("#cancel-btn").attr("tabindex", 101).on('click.task', function(e) {item.cancel_edit(e); return false;});
		item.edit_form.find("#ok-btn").attr("tabindex", 100).on('click.task', function() {item.apply_record()});
	}
	
	function expand_buttons(form) {
		form.find(".modal-footer button.btn").each(function() {
			if ($(this).outerWidth() < 100) {
				$(this).outerWidth(100);
			}
		});
	}
	
	function on_after_show_edit_form(item) {
		if (item.details_active) {
			item.eachDetail(function(d) {
				d.update_controls();
			});
		}
		else {
			item.open_details();
		}
		expand_buttons(item.edit_form);
		resize_edit_table(item);	
	}
	
	function on_edit_form_close_query(item) {
		var result = true;
		if (item.is_changing()) {
			if (item.modified) {
				item.yesNoCancel(task.language.save_changes,
					function() {
						item.apply_record();
					},
					function() {
						item.cancel_edit();
					}
				);
				result = false;
			}
			else {
				item.cancel();
			}
		}
		return result;
	}
	
	function on_before_show_filter_form(item) {
		item.filter_form.title = item.item_caption + ' - filter';
		item.create_filter_inputs(item.filter_form.find(".edit-body"));
		item.filter_form.find("#cancel-btn").attr("tabindex", 101).on('click.task', function() {item.close_filter()});
		item.filter_form.find("#ok-btn").attr("tabindex", 100).on('click.task', function() {item.apply_filter()});
	}
	
	function on_after_show_filter_form(item) {
		expand_buttons(item.filter_form);
	}
	
	function on_before_show_params_form(item) {
		item.create_param_inputs(item.params_form.find(".edit-body"));
		item.params_form.find("#cancel-btn").attr("tabindex", 101).on('click.task', function() {item.close_params_form()});
		item.params_form.find("#ok-btn").attr("tabindex", 100).on('click.task', function() {item.process_report()});
	}
	
	function on_after_show_params_form(item) {
		expand_buttons(item.params_form);
	}
	
	function resize_view_table(item) {
		var newHeight;
		if (item.view_table) {
			newHeight = item.view_table.height() + $(window).height() - $('body').height() - 40;
			if (newHeight < 200) {
				newHeight = 200;
			}
			item.view_table.height(newHeight);
			item.view_table.resize();
		}
	}
	
	function resize_edit_table(item, window_resized) {
		var edit_form_height,
			window_height,
			newHeight;
		if (item.edit_form && item.edit_table) {
			edit_form_height = item.edit_form.height();
			window_height = $(window).height();
			if (window_resized || edit_form_height > window_height - 20) {
				newHeight = item.edit_table.height() - (edit_form_height - window_height) - 20;
				if (newHeight > 450) {
					newHeight = 450;
				}
				if (newHeight < 200) {
					newHeight = 200;
				}
				item.edit_table.height(newHeight);
				item.edit_table.resize();
			}
		}
	}
	
	function resize_items(task) {
		var i,
			j,
			group,
			item;
		for (i = 0; i < task.items.length; i++) {
			group = task.items[i];
			for (j = 0; j < group.items.length; j++) {		
				item = group.items[j];
				if (item.resize) {
					item.resize(item);
				}
			}
		}	
	}
	
	var timeOut;
	
	function resize(task) {
		clearTimeout(timeOut);
		timeOut = setTimeout(function() {
			resize_items(task);
		},
		100);
	}
	this.view_projects = view_projects;
	this.on_page_loaded = on_page_loaded;
	this.check_files = check_files;
	this.create_print_btns = create_print_btns;
	this.on_before_show_view_form = on_before_show_view_form;
	this.on_after_show_view_form = on_after_show_view_form;
	this.on_before_show_edit_form = on_before_show_edit_form;
	this.expand_buttons = expand_buttons;
	this.on_after_show_edit_form = on_after_show_edit_form;
	this.on_edit_form_close_query = on_edit_form_close_query;
	this.on_before_show_filter_form = on_before_show_filter_form;
	this.on_after_show_filter_form = on_after_show_filter_form;
	this.on_before_show_params_form = on_before_show_params_form;
	this.on_after_show_params_form = on_after_show_params_form;
	this.resize_view_table = resize_view_table;
	this.resize_edit_table = resize_edit_table;
	this.resize_items = resize_items;
	this.resize = resize;
}

window.task_events.events1 = new Events1();

function Events2() { // jamdoc.catalogs 

	function on_before_show_view_form(item) {
		var timeOut,
			search;
		if (item.default_field) {
			if (item.lookup_field && item.lookup_field.value) {
				item.view_form.find(".view-title #title-left")
					.append($('<p><a href="#" id="cur_value">' + item.lookup_field.lookup_text + '</a></p>'))
					.css('padding-top', '12px');
				item.view_form.find("#cur_value").click(function() {
					var text = item.view_form.find("#cur_value").text();
					item.view_form.find('#input-find').val(text);
					item.search(item.default_field.field_name, text);
				});
			}
			search = item.view_form.find("#input-find");
			search.on('input', function() {
				search.css('font-weight', 'normal');
				var where = {},
					input = $(this);
				clearTimeout(timeOut);
				timeOut = setTimeout(function() {
						item.search(item.default_field.field_name, input.val());
						search.css('font-weight', 'bold');
					},
					500
				);
			});
			search.keydown(function(e) {
				var code = (e.keyCode ? e.keyCode : e.which);
				if (code === 13) {
					e.preventDefault();
				}
				else if (code === 40) {
					item.view_form.find(".inner-table").focus();
					e.preventDefault();
				}
			});
			item.view_form.on('keydown', function(e) {
				var code = (e.keyCode ? e.keyCode : e.which);
				if (isCharCode(code) || code === 32 || code === 8) {
					if (!search.is(":focus")) {
						if (code !== 8) {
							search.val('');
						}
						search.focus();
					}
				}
			});
		}
		else {
			item.view_form.find("#title-right .form-inline").hide();
		}
	}
	
	function isCharCode(code) {
		if (code >= 65 && code <= 90 || code >= 186 && code <= 192 || code >= 219 && code <= 222) {
			return true;
		}
	}
	
	function on_after_show_view_form(item) {
		setTimeout(function() {
				item.view_form.find(".view-title input").focus();
			},
			0
		);	
	}
	this.on_before_show_view_form = on_before_show_view_form;
	this.isCharCode = isCharCode;
	this.on_after_show_view_form = on_after_show_view_form;
}

window.task_events.events2 = new Events2();

function Events3() { // jamdoc.journals 

	function on_before_show_view_form(item) {
		item.view_form.find("#filter-btn").click(function() {item.create_filter_form()});
		item.on_filter_applied = function(item) {
			if (item.view_form) {
				item.view_form.find(".view-title #title-right")
					.html('<h5 class="pull-right">' + item.get_status_text() + '<h5>');
			}
		};
	}
	
	function on_after_show_view_form(item) {
		if (item.view_table) {
			item.view_table.focus();
		}
	}
	this.on_before_show_view_form = on_before_show_view_form;
	this.on_after_show_view_form = on_after_show_view_form;
}

window.task_events.events3 = new Events3();

function Events5() { // jamdoc.reports 

	function on_before_print_report(report) {
		var select;
		report.extension = 'pdf';
		if (report.params_form) {
			select = report.params_form.find('select');
			if (select && select.val()) {
				report.extension = select.val();
			}
		}
	}
	this.on_before_print_report = on_before_print_report;
}

window.task_events.events5 = new Events5();

function Events6() { // jamdoc.catalogs.parameters 

	function select_project(item) {
		var rec = item.rec_no; 
		item.close_view_form();
		if (!item.is_active.value) {
			item.disable_controls();
			try {
				item.each(function(i) {
					i.edit();
					i.is_active.value = false;
					i.post();
				});
			}
			finally {
				item.rec_no = rec;
				item.enable_controls();
			}
			item.edit();
			item.is_active.value = true;
			item.post();
			item.apply();
			item.task.on_page_loaded(item.task);
		}
	}
	
	function init_table(item, table_options) {
		item.view_options.width = 600;
		table_options.height = 300;
		table_options.on_dblclick = function(item) {
			if (valid_path(item)) {
				select_project(item);
			}
			else {
				item.warning('Invalid project path.')
			}
		};
	}
	
	function on_after_show_view_form(item) {
		if (item.record_count()) {
			if (!valid_path(item)) {
				item.edit_record();
			}
		}
		else {
			item.append_record();
		}
	}
	
	function valid_path(item) {
		return item.task.server('valid_project_path', [item.doc_path.value]);
	}
	
	function on_field_validate(field) {
		if (field.field_name === 'project_name' && !field.value) {
			return 'Project name is required';
		}
		if (field.field_name === 'doc_path') {
			if (!valid_path(field.owner)) {
				return 'Project path is invalid';
			}
		}
	}
	
	function on_field_changed(field, lookup_item) {
		if (field.field_name === 'doc_path') {
			field.value = $.trim(field.value);
		}
	}
	this.select_project = select_project;
	this.init_table = init_table;
	this.on_after_show_view_form = on_after_show_view_form;
	this.valid_path = valid_path;
	this.on_field_validate = on_field_validate;
	this.on_field_changed = on_field_changed;
}

window.task_events.events6 = new Events6();

function Events8() { // jamdoc.catalogs.doc_editor 

	function load_doc(item) {
		var data = item.task.server('load_file', [item.doc_id]);
		if (data.error) {
			item.warning(data.error);
		}
		else {
			item.valid_doc = true;
			return data.result;
		}
	}
	
	function save_doc(item) {
		item.task.server('save_doc', [item.doc_id, item.editor.getValue()]);
	}
	
	function on_before_show_view_form(item) {
		var width = $("#content").width() + 100, 
			height = $(window).height() - 226;
		if (width < 630) {
			width = 630;
		}
		item.view_options.width = width;
		item.view_options.title = item.file_name;	
		item.view_form.find(".modal-body").css("padding", 0);
		item.view_form.find('#editor-box').height($(window).height() - 200);
		item.view_form.find("#cancel-btn").attr("tabindex", 101).on('click', function(e) {
			cancel_edit(item);
		});
		item.view_form.find("#ok-btn").attr("tabindex", 100).on('click', function() {
			save_edit(item);
		});
		item.view_form.find("#preview-btn").attr("tabindex", 99).hide().on('click', function() {
			preview(item);
		});
		item.view_form.find("#section-btn").click(function() {insert_section(item)});	
		item.view_form.find("#subsection-btn").click(function() {insert_sub_section(item)});		
		item.view_form.find("#image-btn").click(function() {insert_image(item)});
		item.view_form.find("#figure-btn").click(function() {insert_figure(item)});	
		item.view_form.find("#link-btn").click(function() {insert_link(item)});	
		item.file_ext = item.file_name.split('.').pop();
		if ('.' + item.file_ext !== item.task.source_suffix) {
			item.view_form.find("#left-box").hide();
		}
		item.view_form.find("#build-info-btn").hide().click(function() {
			show_build_info(item);
		});
	}
	
	function show_build_info(item) {
		var i = 0,
			color,
			html = '<p>',
			info = item.build_result.split('\n');
		
		for (i = 0; i < info.length; i++) {
			color = '#333333';
			if (build_problems(item, info[i])) {
				color = 'red';
			}
			html += '<span style="color: ' + color + ';">' + info[i] + '</span><br>';
		}
		html += '</p>';
		html = $(html).css("margin", 20);
		task.information(html, {width: 700, height: 600,
			title: 'Build information', footer: false, print: true});
	}
	
	function insert_section(item) {
		item.task.param_dialog.get_params(item, 'New section', ['section'], function(result) {
			var divider = '';
			for (var i = 0; i < result.section.length; i ++) {
				divider += '=';
			}
			item.task.doc_editor.editor.insert('\n' + result.section + '\n' + divider + '\n');
		});
	}
	
	function insert_sub_section(item) {
		item.task.param_dialog.get_params(item, 'New subsection', ['section'], function(result) {
			var divider = '';
			for (var i = 0; i < result.section.length; i ++) {
				divider += '-';
			}
			item.task.doc_editor.editor.insert('\n' + result.section + '\n' + divider + '\n');
		});
	}
	
	function insert_image(item) {
		var topics = item.task.topics.copy();
		topics.images = true;
		item.editor.focus();	
		topics.view();	
	}
	
	function insert_figure(item) {
		var topics = item.task.topics.copy();
		topics.images = true;
		topics.figure = true;
		item.editor.focus();	
		topics.view();	
	}
	
	function insert_link(item) {
		var topics = item.task.topics.copy();
		topics.links = true;
		item.editor.focus();
		topics.view();	
	}
	
	function get_extension(item) {
		return item.file_name.split('.').pop();
	}
	
	function on_after_show_view_form(item) {
		var text = load_doc(item),
			ext = get_extension(item);
		if (item.valid_doc) {	
			item.editor = ace.edit("editor-box");
			item.editor.$blockScrolling = Infinity;
			if (ext === 'py') {
				item.editor.getSession().setMode("ace/mode/python");
				item.editor.getSession().setUseSoftTabs(true);
			}
			else if (ext === 'js') {
				item.editor.getSession().setMode("ace/mode/javascript");
			}
			else if (ext === 'html') {
				item.editor.getSession().setMode("ace/mode/html");			
			}
			else if (ext === 'css') {
				item.editor.getSession().setMode("ace/mode/css");
			}
			else if ('.' + ext === item.task.source_suffix) {		
				item.view_form.find("#preview-btn").show();
			}
			
			item.editor.session.setValue(text);   
			item.loaded = true;
			item.editor.gotoLine(1);
		
			item.view_form.find('#ok-btn').prop("disabled", true);
		
			item.editor.on('input', function() {
				if (item.loaded) {
					item.loaded = false;
					mark_clean(item);
					return;
				}
				if (is_modified(item)) {
					item.view_form.find('#ok-btn').prop("disabled", false);
				}
				else {
					item.view_form.find('#ok-btn').prop("disabled", true);
				}
			});
			setTimeout(function () {
				$(item.editor).focus();		
				item.view_form.off('keyup.dismiss.modal');
				},  100
			);
		}
	}
	
	function is_modified(item) {
		return !item.editor.session.getUndoManager().isClean();
	}
	
	function mark_clean(item) {
		item.editor.session.getUndoManager().markClean();
	}
	
	function on_view_form_close_query(item) {
		if (item.valid_doc) {
			if (is_modified(item)) {
				item.yesNoCancel(task.language.save_changes,
					function() {
						save_edit(item);
						item.close_view_form();
					},
					function() {
						mark_clean(item);
						item.close_view_form();
					}
				);
				return false;
			}
			else {
				task.code_editor_item = undefined;
				item.editor.destroy();
				return true;
			}
		}
	}
	
	function save_edit(item) {
		if (item.valid_doc) {		
			save_doc(item);
			mark_clean(item);
			item.view_form.find('#ok-btn').prop("disabled", true);
		}
		else {
			item.close_view_form();
		}
	}
	
	function cancel_edit(item) {
		if (item.valid_doc) {	
			mark_clean(item);
		}
		item.close_view_form();
	}
	
	function build_problems(item, info) {
		var inf = info.toUpperCase();
		if (inf.search('ERROR') > 0 || inf.search('WARNING') > 0 || inf.search('SEVERE') > 0) { 
			return true;
		}
	}
	
	function preview(item) {
		var host = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port: ''),
			make_info = item.view_form.find("#make_info"),
			build_info_btn = item.view_form.find("#build-info-btn");
		save_edit(item);
		build_info_btn.hide().css('color', '#333333');
		make_info.text('Building project');
		item.server('make_html', [host, item.relative_path, item.file_name], function(info) {
			if (info.error) {
				item.warning(info.error);
			}
			if (build_problems(item, info.result)) {
				build_info_btn.css('color','red');
			}
			item.build_result = info.result;
			make_info.text('');
			build_info_btn.show();
		});	
	}
	
	function on_view_keydown(item, e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if (code === 27) {
			if (!item.view_form.find('.ace_search').is(':visible')) {
				item.close_view_form();
			}
		}
		if (e.ctrlKey && code === 83) {
			e.preventDefault();
			e.stopPropagation();
			save_edit(item);
		}
		if (e.altKey) {	
			if (code === 83) { 
				e.preventDefault();			
				insert_section(item);
			}
			else if (code === 66) {		
				e.preventDefault();			
				insert_sub_section(item);
			}
			else if (code === 68) {		
				e.preventDefault();			
				insert_link(item);
			}
			else if (code === 73) {		
				e.preventDefault();			
				insert_image(item);
			}
			else if (code === 71) {		
				e.preventDefault();			
				insert_figure(item);
			}
			else if (code === 80) {		
				e.preventDefault();			
				preview(item);
			}
		}
	}
	this.load_doc = load_doc;
	this.save_doc = save_doc;
	this.on_before_show_view_form = on_before_show_view_form;
	this.show_build_info = show_build_info;
	this.insert_section = insert_section;
	this.insert_sub_section = insert_sub_section;
	this.insert_image = insert_image;
	this.insert_figure = insert_figure;
	this.insert_link = insert_link;
	this.get_extension = get_extension;
	this.on_after_show_view_form = on_after_show_view_form;
	this.is_modified = is_modified;
	this.mark_clean = mark_clean;
	this.on_view_form_close_query = on_view_form_close_query;
	this.save_edit = save_edit;
	this.cancel_edit = cancel_edit;
	this.build_problems = build_problems;
	this.preview = preview;
	this.on_view_keydown = on_view_keydown;
}

window.task_events.events8 = new Events8();

function Events9() { // jamdoc.catalogs.param_dialog 

	function get_params(item, title, params_list, call_back) {
		var dialog = item.task.param_dialog;
		dialog.sender = item;
		dialog.call_back = call_back;
		dialog.edit_options.title = title;
		dialog.edit_options.fields = params_list;
		dialog.open({open_empty: true, fields: params_list});
		if (dialog.field_by_name('align')) {
			dialog.field_by_name('align').value_list = ['right', 'center', 'left'];
		}
		if (dialog.field_by_name('figclass')) {
			dialog.field_by_name('figclass').value_list = ['align-right', 'align-center', 'align-left'];
		}
		dialog.append_record();
	}
	
	function on_before_show_edit_form(item) {
		item.edit_form.find("#ok-btn").off('click.task').on('click', function() {
			var result = {};
			if (item.check_record_valid()) {
				item.eachField(function(f) {
					result[f.field_name] = item.field_by_name(f.field_name).display_text;
				});
				item.call_back(result);
				item.cancel_edit();
			}
		});
		item.edit_form.find("input.width").width('20%');
		item.edit_form.find("input.height").width('20%');
		item.edit_form.find("select.align").width('40%');	
		item.edit_form.find("select.figclass").width('40%');		
	}
	
	function on_field_changed(field, lookup_item) {
		var item = field.owner,
			invalid_characters;
		if (field.field_name === 'title' && item.sender.item_name === 'topics') {
			if (!item.file_name.value) {
				invalid_characters = [' ', '<', '>', ':', '"', '/', '\\', '|', '?', '*', '.'];
				item.file_name.value = field.text;
				for (var i = 0; i < invalid_characters.length; i++) {
					var ch = invalid_characters[i];
					item.file_name.value = item.file_name.value.replace(ch, '_');
				}
				item.file_name.value = item.file_name.value.toLowerCase() + '.txt';
			}
		}
	} 
	
	function on_field_validate(field) {
		var clone,
			error = '',
			item = field.owner;
		if (field.field_name === 'file_name' && item.sender.item_name === 'topics') {
			clone = item.sender.clone();
			clone.each(function(c) {
				if (c.file_name.value.toLowerCase() === field.value.toLowerCase()) {
					error = 'There is a file with this name';
					return false;
				}
			});
			if (error) {
				return error;
			}
		}
	}
	
	function on_edit_keydown(item, event) {
		if (event.keyCode === 13){
			event.preventDefault();
			event.stopPropagation();
			item.edit_form.find("#ok-btn").focus().click();
		}
	}
	this.get_params = get_params;
	this.on_before_show_edit_form = on_before_show_edit_form;
	this.on_field_changed = on_field_changed;
	this.on_field_validate = on_field_validate;
	this.on_edit_keydown = on_edit_keydown;
}

window.task_events.events9 = new Events9();

function Events7() { // jamdoc.journals.topics 

	function new_doc(item) {
		item.task.param_dialog.get_params(item, 'New file', ['title', 'file_name'], function(result) {
			var file_id = item.task.server('create_doc', [item.item_tree.id.value, result]);
			if (file_id) {
				item.set_order_by(['file_name']);				
				item.set_where({type__gt: 1, parent: item.item_tree.id.value});					
				item.open();
				item.locate('id', file_id);
				setTimeout(function() {
						item.view_table.focus();
					},
					300
				);
			}
		});
	}
	
	function new_doc_folder(item) {
		item.task.param_dialog.get_params(item, 'New folder', ['folder_name'], function(result) {
			var folder_id = item.task.server('create_doc_folder', [item.item_tree.id.value, result]);
			if (folder_id) {
				build_tree(item);
				item.item_tree.locate('id', folder_id);
			}
		});
	}
	
	function edit_doc(item) {
		item.task.doc_editor.file_name = item.file_name.value;
		item.task.doc_editor.relative_path = item.relative_path.value;	
		item.task.doc_editor.doc_id = item.id.value;
		item.task.doc_editor.view();
	}
	
	function del_doc(item) {
		if (item.record_count()) {
			item.question('Delete file "' + item.file_name.value + '"', function() {
				item.task.server('del_doc', [item.id.value]);
				item.delete();
			});
		}	
	}
	
	function get_link_path(item) {
		var doc_path = item.task.topics.relative_path.value,
			link_path = item.relative_path.value,
			file_name = item.file_name.value.replace(item.task.source_suffix, ''),
			index = link_path.indexOf(doc_path),
			pref,
			path;
		if (index === -1) {
			path = link_path + '/' + file_name;
			path = path.split('\\').join('/');
			pref = path.split('/')[0];
			path = path.replace(pref + '/', '');
			path = '/' + path;
		}
		else {
			path = link_path.replace(doc_path, '') + '/' + file_name;
			path = path.split('\\').join('/');
			path = path.substring(1);
		}
		return path;
	}
	
	function add_link(item) {
		var title = item.server('get_doc_title', [item.id.value]),
			path = get_link_path(item);
		item.task.doc_editor.editor.insert(':doc:`' + title + ' <'+ path +'>`');
		item.close_view_form();
	}
	
	function add_image(item) {
		var path = get_link_path(item),
			caption = 'New image',
			fields = ['width', 'align', 'height', 'alt'];
		if (item.figure) {
			caption = 'New figure';
			fields = ['width', 'align', 'height', 'alt', 'figclass', 'figure_caption'];
		}
		item.task.param_dialog.get_params(item, caption, fields, function(result) {
			var options = '';
			if (result.width) {
				options += '\n\t:width: ' + result.width;
			}
			if (result.align) {
				options += '\n\t:align: ' + result.align;
			}
			if (result.height) {
				options += '\n\t:height: ' + result.height;
			}
			if (result.alt) {
				options += '\n\t:alt: ' + result.alt;
			}
			if (result.figclass) {
				options += '\n\t:figclass: ' + result.figclass;
			}
			if (result.figure_caption) {
				options += '\n\n\t' + result.figure_caption;
			}
			item.task.doc_editor.editor.insert('\n.. image:: ' + path + options + '\n');
			item.close_view_form();
		});
	}
	
	function init_table(item, table_options) {
		item.auto_loading = false;
		item.view_options.width = 1000;	
		table_options.height = $(window).height() - 222;		
		table_options.sortable = false;
		if (item.links) {
			item.view_options.title = 'New link';		
			table_options.on_dblclick = function() {
				add_link(item);
			};
			item.view_form.find(".modal-footer").hide();				
		}
		else if (item.images) {
			item.view_options.width = 800;			
			item.view_options.title = 'New image';		  
			table_options.sortable = true;
			table_options.on_dblclick = function() {
				add_image(item);
			};
			item.view_form.find(".modal-footer").hide();						
		}
		else {
			table_options.height = $(window).height() - 134;
			table_options.on_dblclick = edit_doc;
			table_options.on_dblclick = function() {
				edit_doc(item);
			};
			table_options.row_callback = function(row, item) {
				if (item.file_name.value.indexOf(item.task.source_suffix) === -1) {
					row.find('td.file_name').css("color", "gray");
				}
			};
		}
	}
	
	function on_before_show_view_form(item) {
		item.log_changes = false;
		item.auto_loading = false;
		item.table_fixed = item.view_form.find(".table_fixed");
		item.left_panel = item.view_form.find("#left-panel"); 
		item.right_panel = item.view_form.find("#right-panel");
		item.view_panel = item.view_form.find("#view-panel");
		item.tree_panel = item.view_form.find("#tree-panel");
	
		if (item.images) {
			item.left_panel.hide();
		}
		item.view_form.find("#new-btn").off('click.task').on('click', function() {
			new_doc(item);
		});  
		item.view_form.find("#new-folder-btn").off('click.task').on('click', function() {
			new_doc_folder(item);
		});  
		item.view_form.find("#edit-btn").off('click.task').on('click', function() {
			edit_doc(item);
		});  
		item.view_form.find("#delete-btn").off('click.task').on('click', function() {
			del_doc(item);
		});  
	}
	
	function on_after_show_view_form(item) {
		if (item.images) {
			item.view_options.fields = ['file_name', 'relative_path'];		
			item.set_order_by(['file_name']);	
			item.set_where({type: 4});					
			item.open();	
		}
		else {
			build_tree(item);   
		}
		setTimeout(function() {
				item.view_table.focus();
			},
			100
		);
	}
	
	function build_tree(item) {
		item.item_tree = item.copy({handlers: false});
		item.item_tree.topics = item;
		item.tree_panel.empty();
		item.tree = item.item_tree.create_tree(item.tree_panel,
			{
				id_field: 'id',
				parent_field: 'parent',
				text_field: 'file_name',
				parent_of_root_value: 0
			}
		);
		item.tree.$element.height(item.view_panel.height() - 22);	
		if (item.links) {
			item.item_tree.set_where({type: 1, has_docs: true});
		}
		else {
			item.item_tree.set_where({type: 1});
		}
		item.item_tree.set_order_by(['parent', 'file_name']);
		item.item_tree.open();
		item.tree.expand(item.tree.selected_node);
		item.item_tree.on_after_scroll = tree_changed;
		item.tree_panel.show();
		tree_changed(item.item_tree);
		if (item !== item.task.topics) {
			item.item_tree.locate('id', item.task.topics.parent.value);
		}
	}
	
	function tree_changed(item) {
		item.topics.view_options.fields = ['file_name'];		
		item.topics.set_order_by(['file_name']);	
		if (item.topics.links) {
			item.topics.set_where({type: 3, parent: item.id.value});			
		}
		else if (item.topics.images) {
			item.topics.set_where({type: 4, parent: item.id.value});					
		}
		else {
			item.topics.set_where({type__gt: 1, parent: item.id.value});					
		}
		item.topics.open();	
	}
	
	function on_view_keydown(item, event) {
		if (item === item.task.topics) {
			if (event.keyCode === 45){
				event.preventDefault();
				item.new_doc(item);
			}
			else if (event.keyCode === 46){
				event.preventDefault();
				item.del_doc(item);
			}
		}
	}
	
	function resize(item) {
		if (item === item.task.topics) {
			item.view_table.height($(window).height() - 134);
		}	
		item.tree.$element.height(item.view_panel.height() - 22);	
	}
	this.new_doc = new_doc;
	this.new_doc_folder = new_doc_folder;
	this.edit_doc = edit_doc;
	this.del_doc = del_doc;
	this.get_link_path = get_link_path;
	this.add_link = add_link;
	this.add_image = add_image;
	this.init_table = init_table;
	this.on_before_show_view_form = on_before_show_view_form;
	this.on_after_show_view_form = on_after_show_view_form;
	this.build_tree = build_tree;
	this.tree_changed = tree_changed;
	this.on_view_keydown = on_view_keydown;
	this.resize = resize;
}

window.task_events.events7 = new Events7();

})( window )