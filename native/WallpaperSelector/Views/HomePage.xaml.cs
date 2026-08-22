using System.IO;
using Microsoft.UI.Input;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Microsoft.UI.Xaml.Media;
using Windows.Foundation;
using Windows.Storage;
using Windows.Storage.Pickers;
using WallpaperSelector.Core.Models;
using WinRT.Interop;

namespace WallpaperSelector.Views;

public sealed partial class HomePage : Page
{
    private int? _dragFromIndex;
    private Border? _dragSource;

    public HomePage()
    {
        this.InitializeComponent();
        this.DataContext = App.MainVM;
    }

    #region File actions

    private async void OnAddImageClick(object sender, RoutedEventArgs e)
    {
        var picker = new FileOpenPicker
        {
            SuggestedStartLocation = PickerLocationId.PicturesLibrary,
        };
        picker.FileTypeFilter.Add(".jpg");
        picker.FileTypeFilter.Add(".jpeg");
        picker.FileTypeFilter.Add(".png");
        picker.FileTypeFilter.Add(".bmp");
        picker.FileTypeFilter.Add(".webp");
        picker.FileTypeFilter.Add(".gif");

        // WinUI 3 unpackaged: must set the owner HWND.
        var window = (App.Current as App)?.MainWindow;
        if (window is not null)
        {
            InitializeWithWindow.Initialize(picker, WindowNative.GetWindowHandle(window));
        }

        StorageFile? file = await picker.PickSingleFileAsync();
        if (file != null)
        {
            await App.MainVM.AddWallpaperAsync(file.Path);
        }
    }

    private async void OnExportClick(object sender, RoutedEventArgs e)
    {
        var picker = new FileSavePicker
        {
            SuggestedFileName = "wallpaper-selector-slots",
        };
        picker.FileTypeChoices.Add("JSON", new[] { ".json" });

        var window = (App.Current as App)?.MainWindow;
        if (window is not null)
        {
            InitializeWithWindow.Initialize(picker, WindowNative.GetWindowHandle(window));
        }

        StorageFile? file = await picker.PickSaveFileAsync();
        if (file != null)
        {
            await App.MainVM.ExportConfigAsync(file.Path);
        }
    }

    private async void OnImportClick(object sender, RoutedEventArgs e)
    {
        var picker = new FileOpenPicker
        {
            SuggestedStartLocation = PickerLocationId.DocumentsLibrary,
        };
        picker.FileTypeFilter.Add(".json");

        var window = (App.Current as App)?.MainWindow;
        if (window is not null)
        {
            InitializeWithWindow.Initialize(picker, WindowNative.GetWindowHandle(window));
        }

        StorageFile? file = await picker.PickSingleFileAsync();
        if (file != null)
        {
            await App.MainVM.ImportConfigAsync(file.Path);
        }
    }

    #endregion

    #region Drag-and-drop reordering

    /// <summary>
    /// Pointer-based drag reorder (WinUI ListView has no built-in reorder).
    /// On release we hit-test the drop position and call
    /// MainViewModel.ReorderSlots, which re-indexes 1..6 strictly.
    /// </summary>
    private void OnCardPointerPressed(object sender, PointerRoutedEventArgs e)
    {
        if (sender is not Border card) return;

        PointerPoint point = e.GetCurrentPoint(this);
        if (!point.Properties.IsLeftButtonPressed) return;

        _dragSource = card;
        _dragFromIndex = App.MainVM.IndexOf(card.DataContext as WallpaperSlot);
        card.CapturePointer(e.Pointer);
        card.RenderTransform = new ScaleTransform { ScaleX = 1.02, ScaleY = 1.02 };
    }

    private void OnCardPointerMoved(object sender, PointerRoutedEventArgs e)
    {
        // Keep the captured drag alive; drop target is resolved on release.
        if (_dragSource == null) return;
    }

    private void OnCardPointerReleased(object sender, PointerRoutedEventArgs e)
    {
        if (_dragSource == null) return;

        Point position = e.GetPosition(this);
        int target = FindTargetIndex(position);

        if (_dragFromIndex.HasValue && target >= 0 && target != _dragFromIndex.Value)
        {
            App.MainVM.ReorderSlots(_dragFromIndex.Value, target);
        }

        _dragSource.ReleasePointerCapture(e.Pointer);
        _dragSource.RenderTransform = new ScaleTransform { ScaleX = 1, ScaleY = 1 };
        _dragSource.Opacity = 1.0;
        _dragSource = null;
        _dragFromIndex = null;
    }

    private int FindTargetIndex(Point position)
    {
        for (int i = 0; i < SlotsList.Items.Count; i++)
        {
            if (SlotsList.ContainerFromIndex(i) is not FrameworkElement container) continue;

            var transform = container.TransformToVisual(this);
            Point origin = transform.TransformPoint(new Point(0, 0));
            var bounds = new Rect(origin, new Size(container.ActualWidth, container.ActualHeight));

            if (bounds.Contains(position))
            {
                return i;
            }
        }

        return -1;
    }

    #endregion
}
