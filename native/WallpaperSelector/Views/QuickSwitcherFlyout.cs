using System.IO;
using Microsoft.UI;
using Microsoft.UI.Text;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml.Media.Imaging;
using WallpaperSelector.Core.Models;

namespace WallpaperSelector.Views;

/// <summary>
/// Win + Alt + W Quick Switcher HUD — a centered light-dismiss flyout listing
/// all six slots as tappable cards, mirroring the web prototype
/// QuickSwitcherFlyout component.
/// </summary>
public sealed class QuickSwitcherFlyout : Flyout
{
    private readonly VariableSizedWrapGrid _cards = new() { MaximumRowsOrColumns = 3, Orientation = Orientation.Horizontal, ItemWidth = 160, ItemHeight = 140 };
    private readonly List<Border> _cardList = new();
    private readonly Dictionary<int, Image> _images = new();
    private readonly Dictionary<int, TextBlock> _titles = new();

    /// <summary>Zero-based slot index the user selected.</summary>
    public event Action<int>? SlotSelected;

    public QuickSwitcherFlyout()
    {
        var root = new StackPanel { MinWidth = 340, Padding = new Thickness(0) };

        root.Children.Add(new TextBlock
        {
            Text = "Quick Wallpaper Selector",
            FontWeight = FontWeights.Bold,
            FontSize = 15,
            Margin = new Thickness(0, 0, 0, 2),
        });

        root.Children.Add(new TextBlock
        {
            Text = "Click a card — Win+Alt+1..6 also work system-wide. ESC closes.",
            FontSize = 11,
            Foreground = new SolidColorBrush(Color.FromArgb(0xFF, 0x9E, 0x9E, 0x9E)),
            Margin = new Thickness(0, 0, 0, 10),
        });

        for (int i = 0; i < 6; i++)
        {
            int index = i;
            Border card = CreateCard(index);
            card.Tapped += (_, _) =>
            {
                SlotSelected?.Invoke(index);
                this.Hide();
            };
            _cardList.Add(card);
            _cards.Children.Add(card);
        }

        root.Children.Add(_cards);

        this.Content = root;
        this.Placement = FlyoutPlacementMode.Full;
        this.ShouldConstrainToRootBounds = false;
    }

    public void RefreshFromSlots(IReadOnlyList<WallpaperSlot> slots)
    {
        for (int i = 0; i < _cardList.Count && i < slots.Count; i++)
        {
            WallpaperSlot slot = slots[i];

            if (!string.IsNullOrEmpty(slot.ThumbnailPath) && File.Exists(slot.ThumbnailPath))
            {
                _images[i].Source = new BitmapImage(new Uri(slot.ThumbnailPath));
            }
            else
            {
                _images[i].Source = null;
            }

            _titles[i].Text = slot.IsActive ? $"● {slot.Title}" : slot.Title;
            _titles[i].Foreground = slot.IsActive
                ? new SolidColorBrush(Color.FromArgb(0xFF, 0x4C, 0xC3, 0xFF))
                : new SolidColorBrush(Colors.WhiteSmoke);

            _cardList[i].BorderBrush = slot.IsActive
                ? new SolidColorBrush(Color.FromArgb(0xFF, 0x4C, 0xC3, 0xFF))
                : new SolidColorBrush(Color.FromArgb(0x28, 0xFF, 0xFF, 0xFF));
            _cardList[i].BorderThickness = new Thickness(slot.IsActive ? 2 : 1);
        }
    }

    private Border CreateCard(int index)
    {
        var image = new Image
        {
            Stretch = Stretch.UniformToFill,
            Height = 84,
        };

        var title = new TextBlock
        {
            Text = $"Slot {index + 1}",
            FontSize = 11,
            Margin = new Thickness(6, 4, 6, 6),
            Foreground = new SolidColorBrush(Colors.WhiteSmoke),
            TextTrimming = TextTrimming.CharacterEllipsis,
        };

        var badge = new Border
        {
            Background = new SolidColorBrush(Color.FromArgb(0xCC, 0x00, 0x00, 0x00)),
            CornerRadius = new CornerRadius(6),
            Padding = new Thickness(6, 2, 6, 2),
            HorizontalAlignment = HorizontalAlignment.Left,
            VerticalAlignment = VerticalAlignment.Top,
            Margin = new Thickness(6, 6, 0, 0),
            Child = new TextBlock
            {
                Text = $"{index + 1}",
                FontSize = 11,
                FontWeight = FontWeights.Bold,
                Foreground = new SolidColorBrush(Colors.White),
            },
        };

        var grid = new Grid();
        grid.Children.Add(image);
        grid.Children.Add(badge);

        var stack = new StackPanel();
        stack.Children.Add(grid);
        stack.Children.Add(title);

        var card = new Border
        {
            Width = 150,
            Margin = new Thickness(4),
            CornerRadius = new CornerRadius(10),
            Background = new SolidColorBrush(Color.FromArgb(0xFF, 0x14, 0x16, 0x1D)),
            BorderThickness = new Thickness(1),
            BorderBrush = new SolidColorBrush(Color.FromArgb(0x28, 0xFF, 0xFF, 0xFF)),
            Child = stack,
        };

        _images[index] = image;
        _titles[index] = title;
        return card;
    }
}
