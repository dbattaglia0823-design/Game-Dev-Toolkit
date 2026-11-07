extends CanvasLayer
class_name GDTToastManager
## Add a Label as child named ToastLabel; one message at a time.

@export var default_duration: float = 1.8
@onready var label: Label = $ToastLabel
var _serial := 0

func _ready() -> void:
    label.hide()

func show_message(message: String, duration: float = -1.0) -> void:
    _serial += 1
    var this_serial := _serial
    label.text = message
    label.show()
    var seconds := default_duration if duration < 0.0 else duration
    if seconds <= 0.0:
        return
    await get_tree().create_timer(seconds).timeout
    if this_serial == _serial and is_instance_valid(label):
        label.hide()

func dismiss() -> void:
    _serial += 1
    label.hide()
