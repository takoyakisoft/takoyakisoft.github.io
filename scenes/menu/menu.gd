extends Control

@onready var btn_striker = $MarginContainer/Control/VBoxContainer/StrikerButton
@onready var btn_gunner = $MarginContainer/Control/VBoxContainer/GunnerButton
@onready var btn_blade = $MarginContainer/Control/VBoxContainer/BladeButton
@onready var btn_exit = $MarginContainer/Control/VBoxContainer/ExitButton


func _ready():
	# needed for gamepads to work
	btn_striker.grab_focus()
	if OS.has_feature('web'):
		btn_exit.queue_free() # exit button doesn't make sense on HTML5


func _start_game(character_id: String) -> void:
	var params = {
		"show_progress_bar": true,
		"character_id": character_id,
	}
	GGT.change_scene("res://scenes/gameplay/gameplay.tscn", params)


func _on_StrikerButton_pressed() -> void:
	_start_game("striker")


func _on_GunnerButton_pressed() -> void:
	_start_game("gunner")


func _on_BladeButton_pressed() -> void:
	_start_game("blade")


func _on_ExitButton_pressed() -> void:
	# gently shutdown the game
	var transitions = get_node_or_null("/root/GGT_Transitions")
	if transitions:
		transitions.fade_in({
			'show_progress_bar': false
		})
		await transitions.anim.animation_finished
		await get_tree().create_timer(0.3).timeout
	get_tree().quit()
