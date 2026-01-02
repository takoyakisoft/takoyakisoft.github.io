extends Area2D

var item_type := "currency"
var label_text_val := ""
var label_color_val := Color.WHITE

@onready var label := $Label


func setup(new_type: String, text: String, color: Color) -> void:
	item_type = new_type
	label_text_val = text
	label_color_val = color
	if is_inside_tree():
		label.text = label_text_val
		label.modulate = label_color_val


func _ready() -> void:
	if label_text_val != "":
		label.text = label_text_val
		label.modulate = label_color_val
	area_entered.connect(_on_area_entered)
	if $AnimationPlayer.has_animation("float"):
		$AnimationPlayer.play("float")


func _on_area_entered(area: Area2D) -> void:
	if area.is_in_group("xp_pickup"):
		var gameplay = get_tree().get_first_node_in_group("gameplay")
		if gameplay:
			gameplay.apply_item_effect(item_type)
		queue_free()
