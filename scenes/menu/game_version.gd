extends Label


func _ready():
	# you need to enable "Advanced Settings" to make this property visible
	text = ProjectSettings.get_setting("application/config/version")
