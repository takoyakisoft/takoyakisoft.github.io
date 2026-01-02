extends Area2D

var item_type := "currency"

@onready var label := $Label

func setup(new_type: String, label_text: String, color: Color) -> void:
	item_type = new_type
	label.text = label_text
	label.modulate = color

func _ready() -> void:
	area_entered.connect(_on_area_entered)
	$AnimationPlayer.play("float")

func _on_area_entered(area: Area2D) -> void:
	if area.is_in_group("xp_pickup"):
		var gameplay = get_tree().get_first_node_in_group("gameplay")
		if gameplay:
			gameplay.apply_item_effect(item_type)
		queue_free()
