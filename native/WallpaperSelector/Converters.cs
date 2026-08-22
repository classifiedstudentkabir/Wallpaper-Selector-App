using Microsoft.UI;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Data;
using Microsoft.UI.Xaml.Media;

namespace WallpaperSelector;

/// <summary>Active slot → accent border brush; inactive → subtle white border.</summary>
public sealed class ActiveSlotBorderConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        bool isActive = value is bool b && b;
        return isActive
            ? new SolidColorBrush(Color.FromArgb(0xFF, 0x00, 0x78, 0xD4))
            : new SolidColorBrush(Color.FromArgb(0x33, 0xFF, 0xFF, 0xFF));
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language)
        => throw new NotSupportedException();
}

/// <summary>bool → Visibility (named to avoid clashing with the built-in key).</summary>
public sealed class BoolToVisibilityConverter2 : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
        => value is bool b && b ? Visibility.Visible : Visibility.Collapsed;

    public object ConvertBack(object value, Type targetType, object parameter, string language)
        => throw new NotSupportedException();
}
