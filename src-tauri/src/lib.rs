use cuid2::create_id;

#[tauri::command]
fn generate_cuid() -> String {
    create_id()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![generate_cuid])
        .run(tauri::generate_context!())
        .expect("error running tauri application")
}
