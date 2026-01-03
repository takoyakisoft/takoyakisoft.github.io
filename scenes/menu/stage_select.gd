extends Control

var character_id := "gravecaller"

@onready var stage_list = $MarginContainer/Control/VBoxContainer/StageScroll/StageList
@onready var btn_back = $MarginContainer/Control/VBoxContainer/BackButton


func _ready() -> void:
	var scene_data = GGT.get_current_scene_data()
	character_id = scene_data.params.get("character_id", "gravecaller")
	build_stage_buttons()
	if stage_list.get_child_count() > 0:
		var first = stage_list.get_child(0)
		if first is Control:
			first.grab_focus()
	_wire_back_focus()


func build_stage_buttons() -> void:
	for child in stage_list.get_children():
		child.queue_free()

	var entries: Array[Dictionary] = []
	for stage_id in GameData.STAGES.keys():
		var data = GameData.STAGES[stage_id]
		if data.get("hidden_in_menu", false):
			continue
		(
			entries
			. append(
				{
					"id": stage_id,
					"order": int(data.get("menu_order", 999)),
					"name": str(data.get("name", stage_id)),
					"description": str(data.get("description", "")),
				}
			)
		)
	entries.sort_custom(func(a, b): return a.order < b.order)

	for entry in entries:
		var button := Button.new()
		button.custom_minimum_size = Vector2(320, 70)
		button.focus_mode = Control.FOCUS_ALL
		button.text = entry.name
		if entry.description != "":
			button.text += "\n" + entry.description
		button.pressed.connect(_start_game.bind(entry.id))
		stage_list.add_child(button)

	for i in range(stage_list.get_child_count()):
		var button = stage_list.get_child(i)
		if button is Control:
			var prev = stage_list.get_child(i - 1) if i > 0 else null
			var next = stage_list.get_child(i + 1) if i < stage_list.get_child_count() - 1 else null
			if prev:
				button.focus_neighbor_top = button.get_path_to(prev)
			if next:
				button.focus_neighbor_bottom = button.get_path_to(next)


func _start_game(stage_id: String) -> void:
	var params = {
		"show_progress_bar": true,
		"character_id": character_id,
		"stage_id": stage_id,
	}
	GGT.change_scene("res://scenes/gameplay/gameplay.tscn", params)


func _wire_back_focus() -> void:
	if stage_list.get_child_count() == 0:
		return
	var last = stage_list.get_child(stage_list.get_child_count() - 1)
	if last is Control:
		last.focus_neighbor_bottom = last.get_path_to(btn_back)
		btn_back.focus_neighbor_top = btn_back.get_path_to(last)


func _on_BackButton_pressed() -> void:
	GGT.change_scene("res://scenes/menu/menu.tscn", {"show_progress_bar": true})
