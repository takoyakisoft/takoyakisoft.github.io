extends Control

@onready var character_list = $MarginContainer/Control/VBoxContainer/CharacterScroll/CharacterList
@onready var btn_exit = $MarginContainer/Control/VBoxContainer/ExitButton


func _ready():
	build_character_buttons()
	# needed for gamepads to work
	if character_list.get_child_count() > 0:
		var first = character_list.get_child(0)
		if first is Control:
			first.grab_focus()
	if OS.has_feature("web"):
		btn_exit.queue_free()  # exit button doesn't make sense on HTML5
	else:
		_wire_exit_focus()


func _start_game(character_id: String) -> void:
	var params = {
		"show_progress_bar": true,
		"character_id": character_id,
	}
	GGT.change_scene("res://scenes/menu/stage_select.tscn", params)


func build_character_buttons() -> void:
	for child in character_list.get_children():
		child.queue_free()

	var entries: Array[Dictionary] = []
	for character_id in GameData.CHARACTERS.keys():
		var data = GameData.CHARACTERS[character_id]
		if data.get("hidden_in_menu", false):
			continue
		(
			entries
			. append(
				{
					"id": character_id,
					"order": int(data.get("menu_order", 999)),
					"name": str(data.get("name", character_id)),
					"description": str(data.get("description", "")),
				}
			)
		)
	entries.sort_custom(func(a, b): return a.order < b.order)

	for entry in entries:
		var button := Button.new()
		button.custom_minimum_size = Vector2(260, 70)
		button.focus_mode = Control.FOCUS_ALL
		button.text = entry.name
		if entry.description != "":
			button.text += "\n" + entry.description
		button.pressed.connect(_start_game.bind(entry.id))
		character_list.add_child(button)

	for i in range(character_list.get_child_count()):
		var button = character_list.get_child(i)
		if button is Control:
			var prev = character_list.get_child(i - 1) if i > 0 else null
			var next = (
				character_list.get_child(i + 1)
				if i < character_list.get_child_count() - 1
				else null
			)
			if prev:
				button.focus_neighbor_top = button.get_path_to(prev)
			if next:
				button.focus_neighbor_bottom = button.get_path_to(next)


func _wire_exit_focus() -> void:
	if character_list.get_child_count() == 0:
		return
	var last = character_list.get_child(character_list.get_child_count() - 1)
	if last is Control:
		last.focus_neighbor_bottom = last.get_path_to(btn_exit)
		btn_exit.focus_neighbor_top = btn_exit.get_path_to(last)


func _on_ExitButton_pressed() -> void:
	# gently shutdown the game
	var transitions = get_node_or_null("/root/GGT_Transitions")
	if transitions:
		transitions.fade_in({"show_progress_bar": false})
		await transitions.anim.animation_finished
		await get_tree().create_timer(0.3).timeout
	get_tree().quit()
